/**
 * npm run check:env
 *
 * Validates the environment BEFORE a deploy. Reads .env.local locally; on
 * Vercel the same variables arrive from process.env, so this also works as a
 * build-time guard.
 *
 * Prints one line per variable and exits non-zero if anything required is
 * missing or malformed, so CI/Vercel fails fast instead of shipping a broken
 * app (e.g. a dashboard that redirects to /login forever).
 */
import { config } from "dotenv";

config({ path: ".env.local" });

type Check = {
  key: string;
  required: boolean;
  /** Returns an error message, or null when the value looks valid. */
  validate?: (value: string) => string | null;
  note?: string;
};

const isUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

const checks: Check[] = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    validate: (v) =>
      !isUrl(v)
        ? "must be a URL like https://abcd1234.supabase.co"
        : v.includes("placeholder")
          ? "still the placeholder — paste your real project URL"
          : null,
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    validate: (v) =>
      v.length < 40
        ? "looks too short for a Supabase anon key (expected a long JWT)"
        : v.includes("placeholder")
          ? "still the placeholder — paste your real anon key"
          : null,
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    validate: (v) =>
      v.length < 40 ? "looks too short — paste the service_role key" : null,
    note: "server-only · never NEXT_PUBLIC_ · never committed",
  },
  {
    key: "ADMIN_PASSWORD",
    required: true,
    validate: (v) =>
      v.length < 12 ? "must be at least 12 characters" : null,
    note: "used by npm run seed",
  },
  {
    key: "ADMIN_EMAIL",
    required: true,
    validate: (v) =>
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? null : "must be a valid email",
  },
  {
    key: "NEXT_PUBLIC_SITE_URL",
    required: true,
    validate: (v) =>
      !isUrl(v)
        ? "must be a URL"
        : v.endsWith("/")
          ? "must not end with a trailing slash"
          : null,
  },
  { key: "ADMIN_FULL_NAME", required: false },
  { key: "AUDIT_IP_HASH_SECRET", required: false },
];

let failed = 0;

for (const { key, required, validate, note } of checks) {
  const raw = process.env[key];
  const value = raw?.trim();

  if (!value) {
    if (required) {
      failed++;
      console.log(`✗ ${key.padEnd(28)} missing`);
    } else {
      console.log(`· ${key.padEnd(28)} optional, not set`);
    }
    continue;
  }

  const error = validate?.(value) ?? null;
  if (error) {
    failed++;
    console.log(`✗ ${key.padEnd(28)} ${error}`);
  } else {
    // Never print secrets — only the shape.
    const shown =
      key.startsWith("NEXT_PUBLIC_") && key.endsWith("URL")
        ? value
        : `${value.slice(0, 4)}…(${value.length} chars)`;
    console.log(`✓ ${key.padEnd(28)} ${shown}${note ? `  [${note}]` : ""}`);
  }
}

if (failed > 0) {
  console.error(
    `\n${failed} problem(s). Fill these in .env.local (local) or Project Settings → Environment Variables (Vercel).`,
  );
  process.exit(1);
}

console.log("\nEnvironment OK — ready to deploy.");
