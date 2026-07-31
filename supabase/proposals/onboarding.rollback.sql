-- PROPOSAL ONLY — rollback for onboarding.sql, after confirming no retained records are required.
drop policy if exists onboarding_files_owner_delete on storage.objects;
drop policy if exists onboarding_files_owner_insert on storage.objects;
drop policy if exists onboarding_files_owner_read on storage.objects;
delete from storage.buckets where id = 'onboarding-private';
drop table if exists public.onboarding_documents;
drop table if exists public.onboarding_applications;
drop type if exists public.application_kind;
drop type if exists public.application_status;
