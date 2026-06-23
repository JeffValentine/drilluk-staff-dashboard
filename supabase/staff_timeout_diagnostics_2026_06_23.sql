-- Drill UK Staff Dashboard timeout diagnostics
-- Optional: run this in Supabase SQL Editor if staff loading still times out
-- after performance_timeout_recovery_2026_06_23.sql.

select
  'current_user' as check_name,
  auth.uid()::text as value;

select
  'current_user_role' as check_name,
  public.current_user_role() as value;

select
  'can_access_dashboard' as check_name,
  public.current_user_can_access_dashboard()::text as value;

select
  'staff_members_count' as check_name,
  count(*)::text as value
from public.staff_members;

select
  'staff_members_newest_5' as check_name,
  jsonb_agg(to_jsonb(s) - 'disciplinary' - 'quiz_history' - 'training_logs' - 'checks' - 'values' - 'permissions')::text as value
from (
  select *
  from public.staff_members
  order by updated_at desc
  limit 5
) s;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('staff_members', 'profiles', 'audit_logs')
order by tablename, policyname;
