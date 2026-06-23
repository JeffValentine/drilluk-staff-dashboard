-- Drill UK Staff Dashboard timeout recovery
-- Paste this whole file into Supabase SQL Editor and run it once.
--
-- Purpose:
-- - Stop audit log queries timing out as the table grows.
-- - Make RLS role checks run once per query instead of once per row.
-- - Keep the same access rules: signed-in active staff can read staff records,
--   and only admin/head_admin can read audit logs.

create index if not exists profiles_active_role_id_idx
on public.profiles (id, is_active, role);

create index if not exists staff_members_updated_at_idx
on public.staff_members (updated_at desc);

create index if not exists staff_members_trainee_user_id_idx
on public.staff_members (trainee_user_id);

create index if not exists audit_logs_created_at_idx
on public.audit_logs (created_at desc);

create index if not exists audit_logs_actor_created_at_idx
on public.audit_logs (actor_id, created_at desc);

create index if not exists audit_logs_action_created_at_idx
on public.audit_logs (action, created_at desc);

create index if not exists audit_logs_target_id_idx
on public.audit_logs (target_id);

drop policy if exists "staff_read_authenticated" on public.staff_members;
create policy "staff_read_authenticated"
on public.staff_members for select
using ((select public.current_user_can_access_dashboard()));

drop policy if exists "audit_insert_authenticated" on public.audit_logs;
create policy "audit_insert_authenticated"
on public.audit_logs for insert
with check (
  (select public.current_user_can_access_dashboard())
  and actor_id = (select auth.uid())
);

drop policy if exists "audit_read_admin_head" on public.audit_logs;
create policy "audit_read_admin_head"
on public.audit_logs for select
using ((select public.current_user_role()) in ('admin', 'head_admin'));

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
on public.profiles for select
using (id = (select auth.uid()) or (select public.current_user_role()) = 'head_admin');

drop policy if exists "profiles_head_admin_update" on public.profiles;
create policy "profiles_head_admin_update"
on public.profiles for update
using ((select public.current_user_role()) = 'head_admin')
with check ((select public.current_user_role()) = 'head_admin');
