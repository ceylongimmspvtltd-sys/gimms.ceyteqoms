import type { Role } from "@/lib/permissions";

/** Row shapes for the Phase 1 schema (supabase/migrations/0001_init.sql). */

export type UserStatus = "active" | "invited" | "suspended" | "disabled";
export type DepartmentStatus = "active" | "archived";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  department_id: string | null;
  manager_id: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  head_user_id: string | null;
  status: DepartmentStatus;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  email: string | null;
  action: string;
  ip_hash: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Row shape for 0002_restaurant_submissions.sql ("Digital Race" intake).
 * Columns match the Next.js form field-for-field.
 */
export interface RestaurantSubmission {
  id: string;
  restaurant_name: string;
  location: string | null;
  address: string | null;
  near_by_city: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  restaurant_email: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_whatsapp: string | null;
  social_links: Record<string, string>;
  theme_colors: string[];
  special_note: string | null;
  created_at: string;
}

/**
 * What the public form may send. `id` and `created_at` are server-generated,
 * and every column with a DB default/tolerance is optional.
 */
export interface RestaurantSubmissionInput {
  restaurant_name: string;
  location?: string | null;
  address?: string | null;
  near_by_city?: string | null;
  phone_number?: string | null;
  whatsapp_number?: string | null;
  restaurant_email?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  owner_whatsapp?: string | null;
  social_links?: Record<string, string>;
  theme_colors?: string[];
  special_note?: string | null;
}
