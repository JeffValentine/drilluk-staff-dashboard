-- Run in Supabase SQL editor
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  god_key_enabled boolean not null default false,
  last_seen_at timestamptz,
  role text not null default 'viewer' check (role in ('viewer', 'staff_in_training', 'trainer', 'admin', 'head_admin')),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_members (
  id bigint primary key,
  name text not null,
  role text not null,
  trainer text not null default 'Unassigned',
  trainee_user_id uuid references auth.users(id),
  profile_image text,
  status text not null default 'In Training',
  strong_sides text not null default '',
  attention_points text not null default '',
  signed_off boolean not null default false,
  staff_since text not null default 'N/A',
  role_since text not null default 'N/A',
  promotion text,
  checks jsonb not null default '{}'::jsonb,
  values jsonb not null default '{}'::jsonb,
  permissions jsonb not null default '{}'::jsonb,
  disciplinary jsonb not null default '{"warnings":0,"actions":0,"logs":[]}'::jsonb,
  quiz_history jsonb not null default '[]'::jsonb,
  notes text not null default '',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  target_id text,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.checkbox_catalog (
  id text primary key,
  category text not null check (category in ('role', 'core', 'permission')),
  role text,
  title text not null,
  question text,
  answer text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.rank_display_names (
  rank_key text primary key,
  display_name text not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    'viewer',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists god_key_enabled boolean not null default false;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.staff_members add column if not exists trainee_user_id uuid references auth.users(id);
alter table public.staff_members add column if not exists quiz_history jsonb not null default '[]'::jsonb;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.audit_logs enable row level security;
alter table public.checkbox_catalog enable row level security;
alter table public.rank_display_names enable row level security;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1
$$;

create or replace function public.current_user_has_god_key()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select god_key_enabled from public.profiles where id = auth.uid() limit 1), false)
$$;

create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set last_seen_at = now()
  where id = auth.uid()
$$;

revoke all on function public.touch_last_seen() from public;
grant execute on function public.touch_last_seen() to authenticated;

create or replace function public.admin_delete_user(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if target_user is null then
    raise exception 'target_user is required';
  end if;

  if target_user = auth.uid() then
    raise exception 'Cannot delete your own account from management';
  end if;

  if not (public.current_user_role() = 'head_admin' or public.current_user_has_god_key() = true) then
    raise exception 'Insufficient permissions';
  end if;

  if exists (
    select 1
    from auth.users u
    where u.id = target_user
      and lower(coalesce(u.email, '')) = 'justappletje@gmail.com'
  ) then
    raise exception 'Developer account is protected and cannot be deleted';
  end if;

  update public.staff_members
  set trainee_user_id = null
  where trainee_user_id = target_user;

  delete from public.profiles where id = target_user;
  delete from auth.users where id = target_user;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

create policy "profiles_self_read"
on public.profiles for select
using (id = auth.uid() or public.current_user_role() = 'head_admin');

create policy "profiles_head_admin_update"
on public.profiles for update
using (public.current_user_role() = 'head_admin')
with check (public.current_user_role() = 'head_admin');

drop policy if exists "profiles_god_key_read" on public.profiles;
create policy "profiles_god_key_read"
on public.profiles for select
using (public.current_user_has_god_key() = true);

drop policy if exists "profiles_god_key_update" on public.profiles;
create policy "profiles_god_key_update"
on public.profiles for update
using (public.current_user_has_god_key() = true)
with check (public.current_user_has_god_key() = true);

create policy "profiles_self_god_key_reset"
on public.profiles for update
using (id = auth.uid() and god_key_enabled = true)
with check (
  id = auth.uid()
  and god_key_enabled = true
  and role = 'head_admin'
  and is_active = true
);

create policy "staff_read_authenticated"
on public.staff_members for select
using (auth.uid() is not null);

create policy "staff_write_trainer_admin"
on public.staff_members for insert
with check (public.current_user_role() in ('trainer', 'admin', 'head_admin'));

create policy "staff_update_trainer_admin"
on public.staff_members for update
using (public.current_user_role() in ('trainer', 'admin', 'head_admin'))
with check (public.current_user_role() in ('trainer', 'admin', 'head_admin'));

create policy "staff_update_own_training"
on public.staff_members for update
using (public.current_user_role() = 'staff_in_training' and trainee_user_id = auth.uid())
with check (public.current_user_role() = 'staff_in_training' and trainee_user_id = auth.uid());

create policy "staff_delete_admin_head"
on public.staff_members for delete
using (public.current_user_role() in ('admin', 'head_admin'));

create policy "audit_insert_authenticated"
on public.audit_logs for insert
with check (auth.uid() is not null);

create policy "audit_read_admin_head"
on public.audit_logs for select
using (public.current_user_role() in ('admin', 'head_admin'));

create policy "checkbox_catalog_read_authenticated"
on public.checkbox_catalog for select
using (auth.uid() is not null);

create policy "checkbox_catalog_write_admin_head"
on public.checkbox_catalog for insert
with check (public.current_user_role() in ('admin', 'head_admin'));

create policy "checkbox_catalog_update_admin_head"
on public.checkbox_catalog for update
using (public.current_user_role() in ('admin', 'head_admin'))
with check (public.current_user_role() in ('admin', 'head_admin'));

create policy "checkbox_catalog_delete_admin_head"
on public.checkbox_catalog for delete
using (public.current_user_role() in ('admin', 'head_admin'));

create policy "rank_display_read_authenticated"
on public.rank_display_names for select
using (auth.uid() is not null);

create policy "rank_display_write_authenticated"
on public.rank_display_names for insert
with check (auth.uid() is not null);

create policy "rank_display_update_authenticated"
on public.rank_display_names for update
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "rank_display_delete_admin_head"
on public.rank_display_names for delete
using (public.current_user_role() in ('admin', 'head_admin'));
