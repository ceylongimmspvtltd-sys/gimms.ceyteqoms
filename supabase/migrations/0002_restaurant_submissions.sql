-- ─────────────────────────────────────────────────────────────────────────────
-- Ceyteq General Management System — 0002: restaurant_submissions
--
-- Public "Digital Race" restaurant intake. The columns match the Next.js
-- form field-for-field; each one maps 1:1 to a form input.
--
-- Access model (important):
--   • INSERT  → `anon` AND `authenticated`. The form is public-facing, so the
--               request arrives with no session. Write-only by design.
--   • SELECT  → signed-in staff only.
--   • UPDATE  → super admin only.
--   • DELETE  → super admin only.
--   A submitter can therefore never read back — or enumerate — other rows.
--
-- Rate limiting is NOT a database concern: enforce it in the API route
-- (see src/lib/api-helpers.ts) before the insert.
--
-- Idempotent — safe to re-run. Run in the Supabase SQL editor, or
-- `supabase db push`.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ── Table ────────────────────────────────────────────────────────────────────
create table if not exists public.restaurant_submissions (
  id                uuid primary key default gen_random_uuid(),

  -- Restaurant
  restaurant_name   text not null,
  location          text,
  address           text,
  near_by_city      text,
  phone_number      text,
  whatsapp_number   text,
  restaurant_email  text,

  -- Owner / contact person
  owner_name        text,
  owner_email       text,
  owner_phone       text,
  owner_whatsapp    text,

  -- Brand inputs from the form
  social_links      jsonb not null default '{}'::jsonb,
  theme_colors      text[] not null default '{}'::text[],
  special_note      text,

  created_at        timestamptz not null default now(),

  constraint restaurant_submissions_name_not_blank
    check (length(btrim(restaurant_name)) between 1 and 200),
  constraint restaurant_submissions_restaurant_email_format
    check (restaurant_email is null or restaurant_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint restaurant_submissions_owner_email_format
    check (owner_email is null or owner_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint restaurant_submissions_social_links_object
    check (jsonb_typeof(social_links) = 'object'),
  constraint restaurant_submissions_theme_colors_max
    check (array_length(theme_colors, 1) is null or array_length(theme_colors, 1) <= 12),
  constraint restaurant_submissions_special_note_length
    check (special_note is null or length(special_note) <= 5000)
);

-- ── Cleanup: if an earlier version of this migration was already applied,
--    drop the columns it introduced that are not part of the final form. ─────
alter table public.restaurant_submissions
  drop column if exists reference,
  drop column if exists cuisine,
  drop column if exists city,
  drop column if exists country,
  drop column if exists website,
  drop column if exists seating_capacity,
  drop column if exists contact_name,
  drop column if exists email,
  drop column if exists phone,
  drop column if exists message,
  drop column if exists payload,
  drop column if exists source,
  drop column if exists status,
  drop column if exists assigned_to,
  drop column if exists department_id,
  drop column if exists reviewed_by,
  drop column if exists reviewed_at,
  drop column if exists internal_notes,
  drop column if exists ip_hash,
  drop column if exists user_agent,
  drop column if exists updated_at;

-- The triage enum was only used by the dropped `status` column.
drop type if exists public.submission_status;

-- ── Indexes (newest first; lookups by city and owner contact) ───────────────
create index if not exists restaurant_submissions_created_at_idx
  on public.restaurant_submissions (created_at desc);
create index if not exists restaurant_submissions_near_by_city_idx
  on public.restaurant_submissions (near_by_city);
create index if not exists restaurant_submissions_location_idx
  on public.restaurant_submissions (location);
create index if not exists restaurant_submissions_restaurant_email_idx
  on public.restaurant_submissions (lower(restaurant_email));
create index if not exists restaurant_submissions_owner_email_idx
  on public.restaurant_submissions (lower(owner_email));

-- ── Duplicate-submission guard ──────────────────────────────────────────────
-- One restaurant name per city per day. Catches double-taps and naive bots
-- without blocking a genuine retry the next day. Uses the immutable form of
-- the timestamp cast so the index expression is allowed.
create unique index if not exists restaurant_submissions_daily_unique_idx
  on public.restaurant_submissions (
    lower(btrim(restaurant_name)),
    lower(coalesce(near_by_city, '')),
    date_trunc('day', created_at at time zone 'UTC')
  );

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.restaurant_submissions enable row level security;

-- Public form: anyone may submit. Deliberately no status/ownership columns
-- exist, so there is nothing for a crafted request to escalate.
drop policy if exists restaurant_submissions_insert_public
  on public.restaurant_submissions;
create policy restaurant_submissions_insert_public
  on public.restaurant_submissions
  for insert to anon, authenticated
  with check (true);

-- Staff read (internal tool — every signed-in user is staff).
drop policy if exists restaurant_submissions_select
  on public.restaurant_submissions;
create policy restaurant_submissions_select
  on public.restaurant_submissions
  for select to authenticated
  using (true);

-- Corrections are super-admin only; submissions are otherwise append-only.
drop policy if exists restaurant_submissions_update
  on public.restaurant_submissions;
create policy restaurant_submissions_update
  on public.restaurant_submissions
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists restaurant_submissions_delete
  on public.restaurant_submissions;
create policy restaurant_submissions_delete
  on public.restaurant_submissions
  for delete to authenticated
  using (public.is_super_admin());

-- ── Table privileges (RLS still applies on top) ─────────────────────────────
-- anon gets INSERT only — no select/update/delete.
grant insert on public.restaurant_submissions to anon;
grant select, insert, update, delete on public.restaurant_submissions to authenticated;
grant all on public.restaurant_submissions to service_role;

comment on table public.restaurant_submissions is
  'Public "Digital Race" restaurant intake. Write-only for anon; reads are staff-only via RLS.';
comment on column public.restaurant_submissions.social_links is
  'Arbitrary social handles/URLs, e.g. {"instagram":"...","facebook":"..."}.';
comment on column public.restaurant_submissions.theme_colors is
  'Brand palette from the form, e.g. {"#10244A","#4DB8E8"}.';
