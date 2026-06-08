-- Drill UK Staff Dashboard final public-surface lockdown
-- Run this after the 2026-06-07 security patches.
-- It removes leftover anonymous execute access inherited through PostgreSQL's
-- broad "public" role while keeping authenticated dashboard access working.

revoke all on function public.is_developer_account() from public;
revoke all on function public.is_developer_account() from anon;
grant execute on function public.is_developer_account() to authenticated;

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
