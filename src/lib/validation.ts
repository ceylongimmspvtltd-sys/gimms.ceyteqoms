import { z } from "zod";

/** Shared Zod schemas — used on the server for every auth boundary. */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128),
  /** Honeypot — must stay empty. Bots that fill it are rejected silently. */
  companyWebsite: z.string().max(0).optional().default(""),
});

export const otpSchema = z.object({
  email: emailSchema,
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const resetRequestSchema = z.object({
  email: emailSchema,
  companyWebsite: z.string().max(0).optional().default(""),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "New password must be different from the current one.",
    path: ["newPassword"],
  });

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80)
    .regex(/^[\p{L}\p{M} .'-]+$/u, "Name contains invalid characters."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type OtpInput = z.infer<typeof otpSchema>;

/**
 * Public "Digital Race" restaurant submission form.
 * Mirrors the CHECK constraints in 0002_restaurant_submissions.sql — the
 * server rejects bad input before it ever reaches Postgres.
 * Empty strings are coerced to null so optional fields stay clean in the DB.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v?.length ? v : null));

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const restaurantSubmissionSchema = z.object({
  restaurant_name: z
    .string()
    .trim()
    .min(1, "Enter the restaurant name.")
    .max(200, "Restaurant name is too long."),
  location: optionalText(200),
  address: optionalText(500),
  near_by_city: optionalText(120),
  phone_number: optionalText(32),
  whatsapp_number: optionalText(32),
  restaurant_email: emailSchema.optional().nullable().or(z.literal("")).transform((v) => v || null),
  owner_name: optionalText(200),
  owner_email: emailSchema.optional().nullable().or(z.literal("")).transform((v) => v || null),
  owner_phone: optionalText(32),
  owner_whatsapp: optionalText(32),
  /** e.g. { instagram: "handle", facebook: "page-url" } — strings only. */
  social_links: z
    .record(z.string(), z.string().trim().max(300))
    .optional()
    .default({}),
  /** Brand palette — hex only, max 12 (matches the DB constraint). */
  theme_colors: z
    .array(z.string().trim().regex(HEX_COLOR, "Use a hex colour like #10244A."))
    .max(12, "At most 12 theme colours.")
    .optional()
    .default([]),
  special_note: optionalText(5000),
  /** Honeypot — must stay empty. Filled = silent drop at the API layer. */
  companyWebsite: z.string().max(0).optional().default(""),
});

export type RestaurantSubmissionForm = z.infer<typeof restaurantSubmissionSchema>;
