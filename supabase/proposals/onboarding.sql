-- PROPOSAL ONLY — NOT APPLIED
-- Additive, backward-compatible structures for private vendor/driver onboarding.

create type public.application_status as enum ('draft', 'submitted', 'in_review', 'approved', 'rejected');
create type public.application_kind as enum ('vendor', 'driver');

create table public.onboarding_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind public.application_kind not null,
  status public.application_status not null default 'draft',
  details jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind)
);

create table public.onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.onboarding_applications(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete cascade,
  document_type text not null check (char_length(document_type) between 1 and 80),
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

alter table public.onboarding_applications enable row level security;
alter table public.onboarding_documents enable row level security;

create policy onboarding_applications_owner_read on public.onboarding_applications for select to authenticated using ((select auth.uid()) = user_id);
create policy onboarding_applications_owner_insert on public.onboarding_applications for insert to authenticated with check ((select auth.uid()) = user_id);
create policy onboarding_applications_owner_update_draft on public.onboarding_applications for update to authenticated using ((select auth.uid()) = user_id and status = 'draft') with check ((select auth.uid()) = user_id and status in ('draft', 'submitted'));
create policy onboarding_documents_owner_read on public.onboarding_documents for select to authenticated using ((select auth.uid()) = owner_id);
create policy onboarding_documents_owner_insert on public.onboarding_documents for insert to authenticated with check ((select auth.uid()) = owner_id and storage_path like (owner_id::text || '/%'));
create policy onboarding_documents_owner_delete_draft on public.onboarding_documents for delete to authenticated using ((select auth.uid()) = owner_id and exists (select 1 from public.onboarding_applications a where a.id = application_id and a.status = 'draft'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('onboarding-private', 'onboarding-private', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy onboarding_files_owner_read on storage.objects for select to authenticated using (bucket_id = 'onboarding-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy onboarding_files_owner_insert on storage.objects for insert to authenticated with check (bucket_id = 'onboarding-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy onboarding_files_owner_delete on storage.objects for delete to authenticated using (bucket_id = 'onboarding-private' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Administrative review must use a separately approved server-side service-role endpoint.
-- Do not add broad public/admin policies to these sensitive records.
