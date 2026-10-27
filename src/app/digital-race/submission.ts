import { restaurantSubmissionSchema, type RestaurantSubmissionForm } from "@/lib/validation";

/**
 * Pure request parsing for the public Digital Race form.
 *
 * Kept free of `next/headers`, "use server" and Supabase imports so it can be
 * unit-tested directly with a real FormData — which is how the form↔column
 * field mapping is verified. `actions.ts` handles origin, rate limiting and
 * the database; this file only decides *what* would be written.
 */

export interface SubmissionState {
  ok?: boolean;
  error?: string;
  /** Keyed by form field name, so the UI can mark the offending input. */
  fieldErrors?: Record<string, string>;
}

export type SubmissionRow = Omit<RestaurantSubmissionForm, "companyWebsite">;

export type ParsedSubmission =
  | { kind: "ok"; row: SubmissionRow }
  /** Honeypot tripped — report success, write nothing. */
  | { kind: "dropped" }
  | { kind: "invalid"; state: SubmissionState };

export const INVALID_ERROR = "Please check the highlighted fields and try again.";

/** Social inputs in the form → keys stored in the `social_links` jsonb column. */
const SOCIAL_FIELDS = ["instagram", "facebook", "tiktok", "website", "google_maps"] as const;

export function parseSubmission(formData: FormData): ParsedSubmission {
  // Honeypot: a real person never sees this field, so a value means a bot.
  if (String(formData.get("company-website") ?? "").length > 0) {
    return { kind: "dropped" };
  }

  // Assemble the jsonb / array columns from their individual inputs.
  const social_links: Record<string, string> = {};
  for (const key of SOCIAL_FIELDS) {
    const value = String(formData.get(`social_${key}`) ?? "").trim();
    if (value) social_links[key] = value;
  }

  const theme_colors = ["1", "2", "3"]
    .map((i) => String(formData.get(`theme_color_${i}`) ?? "").trim())
    .filter(Boolean);

  const parsed = restaurantSubmissionSchema.safeParse({
    restaurant_name: formData.get("restaurant_name"),
    location: formData.get("location"),
    address: formData.get("address"),
    near_by_city: formData.get("near_by_city"),
    phone_number: formData.get("phone_number"),
    whatsapp_number: formData.get("whatsapp_number"),
    restaurant_email: formData.get("restaurant_email"),
    owner_name: formData.get("owner_name"),
    owner_email: formData.get("owner_email"),
    owner_phone: formData.get("owner_phone"),
    owner_whatsapp: formData.get("owner_whatsapp"),
    social_links,
    theme_colors,
    special_note: formData.get("special_note"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { kind: "invalid", state: { error: INVALID_ERROR, fieldErrors } };
  }

  // `companyWebsite` is the honeypot and must never reach the table.
  const { companyWebsite: _ignored, ...row } = parsed.data;
  return { kind: "ok", row };
}
