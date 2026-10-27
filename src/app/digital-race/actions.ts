"use server";

import { parseSubmission, INVALID_ERROR, type SubmissionState } from "@/app/digital-race/submission";
import { assertSameOrigin, getClientIp, isRateLimited } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

/**
 * Public "Digital Race" restaurant submission.
 *
 * Security layers, outermost first:
 *  1. Malformed body guard — a hand-crafted request must not throw (500).
 *  2. Origin (CSRF) check — cross-origin submissions are refused.
 *  3. Rate limit — 5 submissions per IP per 10 minutes.
 *  4. Honeypot + Zod validation, via the pure `parseSubmission` helper.
 *  5. Insert through the **anon** client, so the database's own RLS policy is
 *     the final authority. The service-role key is never used on this path.
 *
 * Errors returned to the browser are deliberately generic; details go to the
 * server log and the audit trail.
 */

export type { SubmissionState } from "@/app/digital-race/submission";

const RATE_LIMIT_ERROR =
  "Too many submissions from this connection. Please try again in a few minutes.";
const GENERIC_ERROR =
  "We couldn't submit your entry just now. Please try again in a moment.";
const NOT_CONFIGURED_ERROR =
  "Submissions are not open yet — the database table is missing. Please contact Ceyteq.";

export async function submitRestaurantAction(
  _prev: SubmissionState | undefined,
  formData: FormData,
): Promise<SubmissionState> {
  // This is a public endpoint, so a hand-crafted request can reach us without
  // a real form body. Fail closed with a normal error state instead of
  // throwing an unhandled TypeError (which surfaces as a 500).
  if (!(formData instanceof FormData)) {
    return { error: GENERIC_ERROR };
  }

  const originError = await assertSameOrigin();
  if (originError) return { error: originError };

  const ip = await getClientIp();
  if (isRateLimited(`restaurant-submission:ip:${ip}`, 5, 10 * 60 * 1000)) {
    return { error: RATE_LIMIT_ERROR };
  }

  const parsed = parseSubmission(formData);

  if (parsed.kind === "dropped") {
    // Bot filled the honeypot — report success but write nothing.
    return { ok: true };
  }
  if (parsed.kind === "invalid") {
    return { ...parsed.state, error: parsed.state.error ?? INVALID_ERROR };
  }

  const { row } = parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("restaurant_submissions").insert(row);

  if (error) {
    // 42P01 = undefined_table: the 0002 migration has not been applied.
    const notConfigured =
      error.code === "42P01" || /does not exist|schema cache/i.test(error.message);

    await logAudit("submission_failed", {
      email: row.restaurant_email ?? null,
      metadata: {
        code: error.code ?? null,
        reason: notConfigured ? "table_missing" : "insert_failed",
      },
    });

    console.error("restaurant_submissions insert failed:", error.code, error.message);
    return { error: notConfigured ? NOT_CONFIGURED_ERROR : GENERIC_ERROR };
  }

  await logAudit("submission_created", {
    email: row.restaurant_email ?? null,
    metadata: { restaurant_name: row.restaurant_name, near_by_city: row.near_by_city },
  });

  return { ok: true };
}
