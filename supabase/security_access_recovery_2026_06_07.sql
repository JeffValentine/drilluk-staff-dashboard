-- Drill UK Staff Dashboard access recovery
-- Run this in Supabase SQL editor if signed-in staff see "No staff records found"
-- after security_advisor_cleanup_2026_06_07.sql.

-- These functions are used inside RLS policies. They must be SECURITY DEFINER so
-- the policy can reliably read the signed-in user's active profile/role without
-- being blocked by the same RLS rules it is trying to evaluate.

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

revoke all on function public.current_user_role() from public;
revoke all on function public.current_user_role() from anon;
grant execute on function public.current_user_role() to authenticated;

revoke all on function public.current_user_is_active() from public;
revoke all on function public.current_user_is_active() from anon;
grant execute on function public.current_user_is_active() to authenticated;

revoke all on function public.current_user_can_access_dashboard() from public;
revoke all on function public.current_user_can_access_dashboard() from anon;
grant execute on function public.current_user_can_access_dashboard() to authenticated;

revoke all on function public.current_user_has_god_key() from public;
revoke all on function public.current_user_has_god_key() from anon;
grant execute on function public.current_user_has_god_key() to authenticated;

revoke all on function public.current_user_can_write_quiz_attempt(bigint) from public;
revoke all on function public.current_user_can_write_quiz_attempt(bigint) from anon;
grant execute on function public.current_user_can_write_quiz_attempt(bigint) to authenticated;

revoke all on function public.current_user_can_write_quiz_attempt_answers(uuid) from public;
revoke all on function public.current_user_can_write_quiz_attempt_answers(uuid) from anon;
grant execute on function public.current_user_can_write_quiz_attempt_answers(uuid) to authenticated;
