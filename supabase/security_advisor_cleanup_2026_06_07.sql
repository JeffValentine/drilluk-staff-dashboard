-- Drill UK Staff Dashboard Security Advisor cleanup
-- Run this after security_patch_2026_06_07.sql.
-- This targets the warnings shown by Supabase Security Advisor without breaking RLS policies.

-- Public buckets can serve public URLs without allowing clients to list every object.
drop policy if exists "staff_cards_public_read" on storage.objects;

-- Use a private schema for helper functions that should not be exposed as /rpc endpoints.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- These helpers are used inside RLS policies, so they must be SECURITY DEFINER.
-- Otherwise staff_members reads can fail because the policy helper cannot reliably
-- read the signed-in user's active profile/role while RLS is being evaluated.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_active from public.profiles where id = auth.uid() limit 1), false)
$$;

create or replace function public.current_user_can_access_dashboard()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role in ('staff_in_training', 'trainer', 'admin', 'head_admin')
  )
$$;

create or replace function public.current_user_has_god_key()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = 'head_admin'
      and god_key_enabled = true
  )
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_is_active() to authenticated;
grant execute on function public.current_user_can_access_dashboard() to authenticated;
grant execute on function public.current_user_has_god_key() to authenticated;
revoke all on function public.current_user_role() from public;
revoke all on function public.current_user_is_active() from public;
revoke all on function public.current_user_can_access_dashboard() from public;
revoke all on function public.current_user_has_god_key() from public;
revoke all on function public.current_user_role() from anon;
revoke all on function public.current_user_is_active() from anon;
revoke all on function public.current_user_can_access_dashboard() from anon;
revoke all on function public.current_user_has_god_key() from anon;

-- Quiz helpers are also used by RLS policies and need the same SECURITY DEFINER behavior.
create or replace function public.current_user_can_write_quiz_attempt(target_staff_member_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    public.current_user_role() in ('trainer', 'admin', 'head_admin')
    or public.current_user_has_god_key() = true
    or exists (
      select 1
      from public.staff_members
      where id = target_staff_member_id
        and trainee_user_id = auth.uid()
        and public.current_user_role() = 'staff_in_training'
    )
  )
$$;

create or replace function public.current_user_can_write_quiz_attempt_answers(target_attempt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.quiz_attempts
    where id = target_attempt_id
      and public.current_user_can_write_quiz_attempt(staff_member_id)
  )
$$;

grant execute on function public.current_user_can_write_quiz_attempt(bigint) to authenticated;
grant execute on function public.current_user_can_write_quiz_attempt_answers(uuid) to authenticated;
revoke all on function public.current_user_can_write_quiz_attempt(bigint) from public;
revoke all on function public.current_user_can_write_quiz_attempt_answers(uuid) from public;
revoke all on function public.current_user_can_write_quiz_attempt(bigint) from anon;
revoke all on function public.current_user_can_write_quiz_attempt_answers(uuid) from anon;

-- Developer check can avoid SECURITY DEFINER by using the JWT email claim instead of auth.users.
create or replace function public.is_developer_account()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'justappletje@gmail.com'
$$;

grant execute on function public.is_developer_account() to authenticated;
revoke all on function public.is_developer_account() from public;
revoke all on function public.is_developer_account() from anon;

-- Public signup pre-validation is no longer needed. The auth trigger validates and consumes tokens.
revoke all on function public.validate_signup_token(text) from public;
revoke all on function public.validate_signup_token(text) from anon;
revoke all on function public.validate_signup_token(text) from authenticated;
drop function if exists public.validate_signup_token(text);

-- Keep the auth trigger function private to triggers only.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- Token generation can run as invoker because invite_tokens RLS already restricts inserts.
create or replace function public.create_signup_token(valid_for_hours int default 168)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  raw_token text;
  token_ttl int := greatest(1, least(coalesce(valid_for_hours, 168), 720));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not (public.current_user_role() = 'head_admin' or public.current_user_has_god_key() = true) then
    raise exception 'Insufficient permissions';
  end if;

  raw_token := encode(gen_random_bytes(24), 'hex');

  insert into public.invite_tokens (token_hash, created_by, expires_at)
  values (encode(digest(raw_token, 'sha256'), 'hex'), auth.uid(), now() + make_interval(hours => token_ttl));

  return raw_token;
end;
$$;

revoke all on function public.create_signup_token(int) from public;
revoke all on function public.create_signup_token(int) from anon;
grant execute on function public.create_signup_token(int) to authenticated;

-- Move the public application rate-limit helper out of the exposed public API schema.
create or replace function private.can_submit_interview_application(discord_value text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.interview_applications
    where lower(trim(discord_name)) = lower(trim(coalesce(discord_value, '')))
      and created_at > now() - interval '10 minutes'
  )
$$;

grant execute on function private.can_submit_interview_application(text) to anon, authenticated;

drop policy if exists "interview_applications_insert_public" on public.interview_applications;
create policy "interview_applications_insert_public"
on public.interview_applications for insert
to anon, authenticated
with check (
  status = 'pending'
  and review_notes = ''
  and reviewed_by is null
  and reviewed_at is null
  and entry_quiz_result = '{}'::jsonb
  and core_quiz_result = '{}'::jsonb
  and interview_scores = '[]'::jsonb
  and interview_total_score = 0
  and interview_max_score = 0
  and interview_started_by is null
  and interview_started_at is null
  and interview_completed_at is null
  and created_at >= now() - interval '1 minute'
  and created_at <= now() + interval '1 minute'
  and private.can_submit_interview_application(discord_name)
);

revoke all on function public.can_submit_interview_application(text) from public;
revoke all on function public.can_submit_interview_application(text) from anon;
revoke all on function public.can_submit_interview_application(text) from authenticated;
drop function if exists public.can_submit_interview_application(text);

-- Revoke anonymous access to RPCs that are only meant for signed-in users.
revoke all on function public.admin_delete_user(uuid) from public;
revoke all on function public.admin_delete_user(uuid) from anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

revoke all on function public.sync_legacy_training_data() from public;
revoke all on function public.sync_legacy_training_data() from anon;
grant execute on function public.sync_legacy_training_data() to authenticated;

revoke all on function public.touch_last_seen() from public;
revoke all on function public.touch_last_seen() from anon;
grant execute on function public.touch_last_seen() to authenticated;

-- These remaining authenticated SECURITY DEFINER warnings are expected:
-- - public.admin_delete_user(uuid): needs elevated auth.users cleanup, checks head_admin/god key internally.
-- - public.touch_last_seen(): only updates last_seen_at for auth.uid().
-- - public.sync_legacy_training_data(): admin migration helper, checks admin/head_admin/god key internally.
