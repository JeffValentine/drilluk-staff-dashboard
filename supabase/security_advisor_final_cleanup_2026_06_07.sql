-- Drill UK Staff Dashboard final Security Advisor cleanup
-- Run after security_advisor_cleanup_2026_06_07.sql.
-- This removes the remaining high-risk authenticated SECURITY DEFINER warnings.

-- The app now disables/unlinks users through normal RLS-protected profile/staff updates,
-- so this high-privilege auth.users deletion RPC should not be exposed.
revoke all on function public.admin_delete_user(uuid) from public;
revoke all on function public.admin_delete_user(uuid) from anon;
revoke all on function public.admin_delete_user(uuid) from authenticated;

-- Legacy migration helper should not be exposed after the database has been migrated.
revoke all on function public.sync_legacy_training_data() from public;
revoke all on function public.sync_legacy_training_data() from anon;
revoke all on function public.sync_legacy_training_data() from authenticated;

-- Supabase Advisor may still flag public.touch_last_seen() because it is
-- SECURITY DEFINER and executable by authenticated users. That function is
-- intentionally left alone because it only updates last_seen_at for auth.uid().
-- Converting it to SECURITY INVOKER would require a broader profiles self-update
-- RLS policy, which would be less safe than the current narrow RPC.
