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

/** Row shapes for 0002_restaurant_submissions.sql ("Digital Race" intake). */

export type SubmissionStatus =
  | "new"
  | "in_review"
  | "contacted"
  | "approved"
  | "rejected"
  | "archived";

export interface RestaurantSubmission {
  id: string;
  reference: string;
  restaurant_name: string;
  cuisine: string | null;
  city: string | null;
  country: string;
  website: string | null;
  seating_capacity: number | null;
  contact_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  payload: Record<string, unknown>;
  source: string;
  status: SubmissionStatus;
  assigned_to: string | null;
  department_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  internal_notes: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

/** What the public form may send — matches the anon INSERT RLS policy. */
export type RestaurantSubmissionInput = Pick<
  RestaurantSubmission,
  "restaurant_name" | "contact_name" | "email"
> &
  Partial<
    Pick<
      RestaurantSubmission,
      | "cuisine"
      | "city"
      | "country"
      | "website"
      | "seating_capacity"
      | "phone"
      | "message"
      | "payload"
      | "source"
    >
  >;
