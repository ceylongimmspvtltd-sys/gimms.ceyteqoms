-- ─────────────────────────────────────────────────────────────────────────────
-- Ceyteq General Management System — 0002: restaurant_submissions
--
-- Public intake table for the "Digital Race" campaign: a visitor submits a
-- restaurant, staff triage it inside the dashboard.
--
-- Access model (important):
--   • INSERT  → `anon` AND `authenticated`. The form is public-facing, so the
--               request arrives with no session. This is the ONLY way the form
--               can work; it is deliberately write-only.
--   • SELECT  → staff only (super admin = all; department head = subtree;
--               everyone else = rows assigned to them / in their department).
--   • UPDATE  → staff (triage: status, assignment, review stamps).
--   • DELETE  → super admin only.
--   A submitter can therefore never read back — or enumerate — other rows.
--
-- Rate limiting is NOT a database concern: enforce it in the API route
-- (see src/lib/api-helpers.ts) before the insert.
--
-- Idempotent — safe to re-run. Run in the Supabase SQL editor, or
-- `supabase db push`.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Triage status ────────────────────────────────────────────────────────────
do $$ begin
  create type public.submission_status as enum (
    'new', 'in_review', 'contacted', 'approved', 'rejected', 'archived'
  );
exception when duplicate_object then null; end $$;

-- ── Table ────────────────────────────────────────────────────────────────────
create table if not exists public.restaurant_submissions (
  id               uuid primary key default gen_random_uuid(),

  -- Human-friendly reference shown to the submitter (e.g. RS-9F2A1C7D).
  reference        text not null unique
                     default 'RS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),

  -- Restaurant
  restaurant_name  text not null,
  cuisine          text,
  city             text,
  country          text not null default 'Sri Lanka',
  website          text,
  seating_capacity integer,

  -- Contact person
  contact_name     text not null,
  email            text not null,
  phone            text,

  -- Free-form intake
  message          text,
  -- Anything the form adds later (dietary options, opening hours, socials…)
  -- without requiring another migration.
  payload          jsonb not null default '{}'::jsonb,
  source           text not null default 'digital-race',

  -- Triage
  status           public.submission_status not null default 'new',
  assigned_to      uuid references public.profiles (id) on delete set null,
  department_id    uuid references public.departments (id) on delete set null,
  reviewed_by      uuid references public.profiles (id) on delete set null,
  reviewed_at      timestamptz,
  internal_notes   text,

  -- Anti-abuse / provenance (raw IPs are never stored — see audit_logs)
  ip_hash          text,
  user_agent       text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint restaurant_submissions_email_format
    check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint restaurant_submissions_name_not_blank
    check (length(btrim(restaurant_name)) between 1 and 200),
  constraint restaurant_submissions_contact_not_blank
    check (length(btrim(contact_name)) between 1 and 200),
  constraint restaurant_submissions_seating_positive
    check (seating_capacity is null or seating_capacity > 0),
  constraint restaurant_submissions_message_length
    check (message is null or length(message) <= 5000)
);

-- ── Indexes (triage views: newest first, by status, by assignee) ────────────
create index if not exists restaurant_submissions_created_at_idx
  on public.restaurant_submissions (created_at desc);
create index if not exists restaurant_submissions_status_idx
  on public.restaurant_submissions (status);
create index if not exists restaurant_submissions_assigned_to_idx
  on public.restaurant_submissions (assigned_to);
create index if not exists restaurant_submissions_department_id_idx
  on public.restaurant_submissions (department_id);
create index if not exists restaurant_submissions_email_idx
  on public.restaurant_submissions (lower(email));

-- ── updated_at automation (reuses the function from 0001) ───────────────────
drop trigger if exists trg_restaurant_submissions_updated_at
  on public.restaurant_submissions;
create trigger trg_restaurant_submissions_updated_at
  before update on public.restaurant_submissions
  for each row execute function public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.restaurant_submissions enable row level security;

-- Public form: anyone may submit a row, but it must arrive untriaged and
-- unassigned. Prevents a crafted request from self-approving an entry.
drop policy if exists restaurant_submissions_insert_public
  on public.restaurant_submissions;
create policy restaurant_submissions_insert_public
  on public.restaurant_submissions
  for insert to anon, authenticated
  with check (
    status = 'new'
    and assigned_to is null
    and reviewed_by is null
    and reviewed_at is null
  );

-- Staff read: super admin = all; heads = subtree; others = own department
-- or rows explicitly assigned to them.
drop policy if exists restaurant_submissions_select
  on public.restaurant_submissions;
create policy restaurant_submissions_select
  on public.restaurant_submissions
  for select to authenticated
  using (
    public.is_super_admin()
    or assigned_to = auth.uid()
    or public.can_access_department(department_id)
  );

-- Staff triage.
drop policy if exists restaurant_submissions_update
  on public.restaurant_submissions;
create policy restaurant_submissions_update
  on public.restaurant_submissions
  for update to authenticated
  using (
    public.is_super_admin()
    or assigned_to = auth.uid()
    or public.can_access_department(department_id)
  )
  with check (
    public.is_super_admin()
    or assigned_to = auth.uid()
    or public.can_access_department(department_id)
  );

-- Only a super admin may destroy a submission.
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
  'Public "Digital Race" restaurant intake. Write-only for anon; triage and reads are staff-only via RLS.';
comment on column public.restaurant_submissions.reference is
  'Submitter-facing public reference (RS-XXXXXXXX). Never used as a security token.';
comment on column public.restaurant_submissions.payload is
  'Flexible extras from the form — add fields here before adding columns.';
comment on column public.restaurant_submissions.ip_hash is
  'HMAC-SHA256 of the client IP for abuse correlation. Raw IPs are never stored.';
