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
  identifiers jsonb not null default '{}'::jsonb,
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
  training_logs jsonb not null default '[]'::jsonb,
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

create table if not exists public.invite_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique not null,
  created_by uuid references auth.users(id),
  used_by uuid references auth.users(id),
  used_email text,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.managed_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_key text not null,
  quiz_title text not null,
  quiz_description text not null default '',
  quiz_kind text not null default 'managed',
  rank_key text,
  pass_score int not null default 80,
  question_order int not null default 0,
  category text not null default 'General Rules',
  question text not null,
  correct_answer text not null,
  wrong_answers jsonb not null default '[]'::jsonb,
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
alter table public.profiles add column if not exists experimental_quiz_enabled boolean not null default false;
alter table public.profiles add column if not exists identifiers jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.staff_members add column if not exists trainee_user_id uuid references auth.users(id);
alter table public.staff_members add column if not exists quiz_history jsonb not null default '[]'::jsonb;
alter table public.staff_members add column if not exists training_logs jsonb not null default '[]'::jsonb;
alter table public.staff_members add column if not exists assigned_quiz_keys jsonb not null default '[]'::jsonb;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.audit_logs enable row level security;
alter table public.checkbox_catalog enable row level security;
alter table public.rank_display_names enable row level security;
alter table public.invite_tokens enable row level security;
alter table public.managed_quiz_questions enable row level security;

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

  update public.staff_members
  set updated_by = null
  where updated_by = target_user;

  update public.audit_logs
  set actor_id = null
  where actor_id = target_user;

  update public.checkbox_catalog
  set updated_by = null
  where updated_by = target_user;

  update public.rank_display_names
  set updated_by = null
  where updated_by = target_user;

  update public.invite_tokens
  set created_by = null
  where created_by = target_user;

  update public.invite_tokens
  set used_by = null
  where used_by = target_user;

  update public.managed_quiz_questions
  set updated_by = null
  where updated_by = target_user;

  update public.quizzes
  set created_by = null,
      updated_by = null
  where created_by = target_user
     or updated_by = target_user;

  update public.quiz_questions
  set updated_by = null
  where updated_by = target_user;

  update public.quiz_assignments
  set assigned_by = null
  where assigned_by = target_user;

  update public.quiz_attempts
  set profile_id = null
  where profile_id = target_user;

  update public.quiz_attempts
  set reviewed_by = null
  where reviewed_by = target_user;

  update public.interview_applications
  set reviewed_by = null
  where reviewed_by = target_user;

  update public.interview_applications
  set interview_started_by = null
  where interview_started_by = target_user;

  update public.interview_question_bank
  set updated_by = null
  where updated_by = target_user;

  update public.video_quizzes
  set updated_by = null
  where updated_by = target_user;

  update public.staff_essentials
  set updated_by = null
  where updated_by = target_user;

  delete from public.profiles where id = target_user;
  delete from auth.users where id = target_user;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
    return false;
  end if;

  update public.invite_tokens
  set used_at = now(),
      used_email = nullif(trim(claimant_email), ''),
      used_by = auth.uid()
  where token_hash = md5(normalized_token)
    and used_at is null
    and (expires_at is null or expires_at > now());

  return found;
end;
$$;

revoke all on function public.create_signup_token(int) from public;
grant execute on function public.create_signup_token(int) to authenticated;
revoke all on function public.consume_signup_token(text, text) from public;
grant execute on function public.consume_signup_token(text, text) to anon, authenticated;

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

drop policy if exists "invite_tokens_read_admin_head" on public.invite_tokens;
create policy "invite_tokens_read_admin_head"
on public.invite_tokens for select
using (public.current_user_role() = 'head_admin' or public.current_user_has_god_key() = true);

drop policy if exists "invite_tokens_insert_admin_head" on public.invite_tokens;
create policy "invite_tokens_insert_admin_head"
on public.invite_tokens for insert
with check (public.current_user_role() = 'head_admin' or public.current_user_has_god_key() = true);



drop policy if exists "managed_quiz_questions_read_authenticated" on public.managed_quiz_questions;
create policy "managed_quiz_questions_read_authenticated"
on public.managed_quiz_questions for select
using (auth.uid() is not null);

drop policy if exists "managed_quiz_questions_write_admin_head" on public.managed_quiz_questions;
create policy "managed_quiz_questions_write_admin_head"
on public.managed_quiz_questions for insert
with check (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "managed_quiz_questions_update_admin_head" on public.managed_quiz_questions;
create policy "managed_quiz_questions_update_admin_head"
on public.managed_quiz_questions for update
using (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true)
with check (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "managed_quiz_questions_delete_admin_head" on public.managed_quiz_questions;
create policy "managed_quiz_questions_delete_admin_head"
on public.managed_quiz_questions for delete
using (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true);



create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  quiz_key text unique not null,
  title text not null,
  description text not null default '',
  quiz_kind text not null default 'custom' check (quiz_kind in ('mandatory', 'rank_pack', 'managed', 'custom')),
  quiz_category text not null default 'custom' check (quiz_category in ('entry', 'core_values', 'staff_menu', 'mandatory', 'custom')),
  rank_scope jsonb not null default '[]'::jsonb,
  pass_score int not null default 80,
  is_active boolean not null default true,
  sort_order int not null default 0,
  source_type text not null default 'native',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  legacy_source_id text,
  question_order int not null default 0,
  category text not null default 'General Rules',
  question text not null,
  correct_answers jsonb not null default '[]'::jsonb,
  wrong_answers jsonb not null default '[]'::jsonb,
  explanation text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create unique index if not exists quiz_questions_quiz_legacy_uidx
on public.quiz_questions (quiz_id, legacy_source_id)
where legacy_source_id is not null;

create table if not exists public.quiz_assignments (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  staff_member_id bigint not null references public.staff_members(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'completed', 'revoked')),
  unique (quiz_id, staff_member_id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  legacy_attempt_id text unique,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  staff_member_id bigint not null references public.staff_members(id) on delete cascade,
  profile_id uuid references auth.users(id),
  score int not null default 0,
  passed boolean not null default false,
  submitted_at timestamptz not null default now(),
  review_status text not null default 'pending' check (review_status in ('pending', 'reviewed', 'failed_review')),
  review_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz
);

create table if not exists public.quiz_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid references public.quiz_questions(id) on delete set null,
  question_order int not null default 0,
  question_prompt text not null,
  selected_answer text,
  correct_answer text,
  is_correct boolean not null default false
);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_assignments enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;

drop policy if exists "quizzes_read_authenticated" on public.quizzes;
create policy "quizzes_read_authenticated"
on public.quizzes for select
using (auth.uid() is not null);

drop policy if exists "quizzes_write_admin_head" on public.quizzes;
create policy "quizzes_write_admin_head"
on public.quizzes for insert
with check (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quizzes_update_admin_head" on public.quizzes;
create policy "quizzes_update_admin_head"
on public.quizzes for update
using (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true)
with check (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quizzes_delete_admin_head" on public.quizzes;
create policy "quizzes_delete_admin_head"
on public.quizzes for delete
using (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quiz_questions_read_authenticated" on public.quiz_questions;
create policy "quiz_questions_read_authenticated"
on public.quiz_questions for select
using (auth.uid() is not null);

drop policy if exists "quiz_questions_write_admin_head" on public.quiz_questions;
create policy "quiz_questions_write_admin_head"
on public.quiz_questions for insert
with check (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quiz_questions_update_admin_head" on public.quiz_questions;
create policy "quiz_questions_update_admin_head"
on public.quiz_questions for update
using (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true)
with check (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quiz_questions_delete_admin_head" on public.quiz_questions;
create policy "quiz_questions_delete_admin_head"
on public.quiz_questions for delete
using (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quiz_assignments_read_authenticated" on public.quiz_assignments;
create policy "quiz_assignments_read_authenticated"
on public.quiz_assignments for select
using (auth.uid() is not null);

drop policy if exists "quiz_assignments_write_trainer_admin" on public.quiz_assignments;
create policy "quiz_assignments_write_trainer_admin"
on public.quiz_assignments for insert
with check (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quiz_assignments_update_trainer_admin" on public.quiz_assignments;
create policy "quiz_assignments_update_trainer_admin"
on public.quiz_assignments for update
using (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true)
with check (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quiz_assignments_delete_trainer_admin" on public.quiz_assignments;
create policy "quiz_assignments_delete_trainer_admin"
on public.quiz_assignments for delete
using (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quiz_attempts_read_authenticated" on public.quiz_attempts;
create policy "quiz_attempts_read_authenticated"
on public.quiz_attempts for select
using (auth.uid() is not null);

drop policy if exists "quiz_attempts_insert_authenticated" on public.quiz_attempts;
create policy "quiz_attempts_insert_authenticated"
on public.quiz_attempts for insert
with check (auth.uid() is not null);

drop policy if exists "quiz_attempts_update_admin_head" on public.quiz_attempts;
create policy "quiz_attempts_update_admin_head"
on public.quiz_attempts for update
using (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true)
with check (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quiz_attempt_answers_read_authenticated" on public.quiz_attempt_answers;
create policy "quiz_attempt_answers_read_authenticated"
on public.quiz_attempt_answers for select
using (auth.uid() is not null);

drop policy if exists "quiz_attempt_answers_insert_authenticated" on public.quiz_attempt_answers;
create policy "quiz_attempt_answers_insert_authenticated"
on public.quiz_attempt_answers for insert
with check (auth.uid() is not null);

drop policy if exists "quiz_attempt_answers_update_admin_head" on public.quiz_attempt_answers;
create policy "quiz_attempt_answers_update_admin_head"
on public.quiz_attempt_answers for update
using (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true)
with check (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true);

create or replace function public.sync_legacy_training_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  managed_record record;
  checkbox_record record;
  checkbox_rank text;
  quiz_id_value uuid;
  staff_record record;
  assignment_key text;
  attempt_value jsonb;
  attempt_index int;
  item_value jsonb;
  question_row uuid;
  derived_category text;
  derived_badge text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true) then
    raise exception 'Insufficient permissions';
  end if;

  for managed_record in
    select *
    from public.managed_quiz_questions
    order by quiz_key, question_order, updated_at
  loop
    derived_category := case
      when managed_record.quiz_key = 'mandatory-general' then 'mandatory'
      else 'custom'
    end;

    insert into public.quizzes (
      quiz_key,
      title,
      description,
      quiz_kind,
      quiz_category,
      rank_scope,
      pass_score,
      source_type,
      updated_by
    )
    values (
      managed_record.quiz_key,
      managed_record.quiz_title,
      managed_record.quiz_description,
      case when managed_record.quiz_key = 'mandatory-general' then 'mandatory' else 'managed' end,
      derived_category,
      case when coalesce(managed_record.rank_key, '') = '' then '[]'::jsonb else jsonb_build_array(managed_record.rank_key) end,
      managed_record.pass_score,
      'legacy_managed',
      managed_record.updated_by
    )
    on conflict (quiz_key) do update
    set
      title = excluded.title,
      description = excluded.description,
      quiz_kind = excluded.quiz_kind,
      quiz_category = excluded.quiz_category,
      rank_scope = excluded.rank_scope,
      pass_score = excluded.pass_score,
      source_type = excluded.source_type,
      updated_by = excluded.updated_by,
      updated_at = now()
    returning id into quiz_id_value;

    insert into public.quiz_questions (
      quiz_id,
      legacy_source_id,
      question_order,
      category,
      question,
      correct_answers,
      wrong_answers,
      updated_by
    )
    values (
      quiz_id_value,
      managed_record.id::text,
      managed_record.question_order,
      managed_record.category,
      managed_record.question,
      jsonb_build_array(managed_record.correct_answer),
      managed_record.wrong_answers,
      managed_record.updated_by
    )
    on conflict (quiz_id, legacy_source_id) do update
    set
      question_order = excluded.question_order,
      category = excluded.category,
      question = excluded.question,
      correct_answers = excluded.correct_answers,
      wrong_answers = excluded.wrong_answers,
      updated_by = excluded.updated_by,
      updated_at = now();
  end loop;

  for checkbox_record in
    select *
    from public.checkbox_catalog
    order by category, id
  loop
    derived_category := case checkbox_record.category
      when 'role' then 'entry'
      when 'core' then 'core_values'
      else 'staff_menu'
    end;
    derived_badge := case checkbox_record.category
      when 'role' then 'Entry Quiz'
      when 'core' then 'Core Values Quiz'
      else 'Staff Menu Quiz'
    end;

    for checkbox_rank in
      select unnest(case when coalesce(checkbox_record.role, '') = '' then array[]::text[] else string_to_array(checkbox_record.role, ',') end)
    loop
      insert into public.quizzes (
        quiz_key,
        title,
        description,
        quiz_kind,
        quiz_category,
        rank_scope,
        pass_score,
        source_type,
        updated_by
      )
      values (
        checkbox_rank || '|' || checkbox_record.category,
        checkbox_rank || ' ' || derived_badge,
        checkbox_rank || ' ' || lower(derived_badge) || ' built from the current knowledge catalog.',
        'rank_pack',
        derived_category,
        jsonb_build_array(checkbox_rank),
        90,
        'legacy_checkbox',
        checkbox_record.updated_by
      )
      on conflict (quiz_key) do update
      set
        title = excluded.title,
        description = excluded.description,
        quiz_kind = excluded.quiz_kind,
        quiz_category = excluded.quiz_category,
        rank_scope = excluded.rank_scope,
        pass_score = excluded.pass_score,
        source_type = excluded.source_type,
        updated_by = excluded.updated_by,
        updated_at = now()
      returning id into quiz_id_value;

      insert into public.quiz_questions (
        quiz_id,
        legacy_source_id,
        question_order,
        category,
        question,
        correct_answers,
        wrong_answers,
        updated_by
      )
      values (
        quiz_id_value,
        checkbox_record.id::text,
        0,
        coalesce(nullif((checkbox_record.answer::jsonb ->> 'bracket'), ''), coalesce(checkbox_record.role, checkbox_record.category)),
        coalesce(checkbox_record.question, checkbox_record.title),
        case
          when jsonb_typeof(checkbox_record.answer::jsonb -> 'correct') = 'array' then checkbox_record.answer::jsonb -> 'correct'
          else jsonb_build_array(coalesce(checkbox_record.answer, ''))
        end,
        case
          when jsonb_typeof(checkbox_record.answer::jsonb -> 'wrong') = 'array' then checkbox_record.answer::jsonb -> 'wrong'
          else '[]'::jsonb
        end,
        checkbox_record.updated_by
      )
      on conflict (quiz_id, legacy_source_id) do update
      set
        category = excluded.category,
        question = excluded.question,
        correct_answers = excluded.correct_answers,
        updated_by = excluded.updated_by,
        updated_at = now();
    end loop;
  end loop;

  for staff_record in select * from public.staff_members loop
    for assignment_key in
      select jsonb_array_elements_text(coalesce(staff_record.assigned_quiz_keys, '[]'::jsonb))
    loop
      select id into quiz_id_value from public.quizzes where quiz_key = assignment_key limit 1;
      if quiz_id_value is null then
        continue;
      end if;

      insert into public.quiz_assignments (quiz_id, staff_member_id, assigned_by, status)
      values (quiz_id_value, staff_record.id, staff_record.updated_by, 'active')
      on conflict (quiz_id, staff_member_id) do update
      set status = 'active', assigned_by = excluded.assigned_by, assigned_at = now();
    end loop;

    attempt_index := 0;
    for attempt_value in
      select value from jsonb_array_elements(coalesce(staff_record.quiz_history, '[]'::jsonb))
    loop
      attempt_index := attempt_index + 1;
      select id into quiz_id_value from public.quizzes where quiz_key = coalesce(attempt_value ->> 'quizKey', 'mandatory-general') limit 1;
      if quiz_id_value is null then
        continue;
      end if;

      insert into public.quiz_attempts (
        legacy_attempt_id,
        quiz_id,
        staff_member_id,
        profile_id,
        score,
        passed,
        submitted_at,
        review_status,
        review_note,
        reviewed_by,
        reviewed_at
      )
      values (
        coalesce(attempt_value ->> 'id', staff_record.id::text || '-' || attempt_index::text),
        quiz_id_value,
        staff_record.id,
        staff_record.trainee_user_id,
        coalesce((attempt_value ->> 'score')::int, 0),
        coalesce((attempt_value ->> 'passed')::boolean, false),
        coalesce((attempt_value ->> 'at')::timestamptz, now()),
        coalesce(attempt_value ->> 'reviewStatus', 'pending'),
        nullif(attempt_value ->> 'reviewNote', ''),
        case
          when coalesce(attempt_value ->> 'reviewedBy', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then (attempt_value ->> 'reviewedBy')::uuid
          else null
        end,
        nullif(attempt_value ->> 'reviewedAt', '')::timestamptz
      )
      on conflict (legacy_attempt_id) do update
      set
        score = excluded.score,
        passed = excluded.passed,
        submitted_at = excluded.submitted_at,
        review_status = excluded.review_status,
        review_note = excluded.review_note,
        reviewed_by = excluded.reviewed_by,
        reviewed_at = excluded.reviewed_at
      returning id into question_row;

      delete from public.quiz_attempt_answers where attempt_id = question_row;

      attempt_index := 0;
      for item_value in
        select value from jsonb_array_elements(coalesce(attempt_value -> 'items', '[]'::jsonb))
      loop
        attempt_index := attempt_index + 1;
        insert into public.quiz_attempt_answers (
          attempt_id,
          question_order,
          question_prompt,
          selected_answer,
          correct_answer,
          is_correct
        )
        values (
          question_row,
          attempt_index,
          coalesce(item_value ->> 'title', item_value ->> 'question', 'Question'),
          item_value ->> 'selected',
          item_value ->> 'correct',
          coalesce((item_value ->> 'isCorrect')::boolean, false)
        );
      end loop;
    end loop;
  end loop;
end;
$$;

revoke all on function public.sync_legacy_training_data() from public;
grant execute on function public.sync_legacy_training_data() to authenticated;


create table if not exists public.interview_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  discord_name text not null,
  age int not null,
  country text not null,
  hours_per_week int not null,
  prior_bans text not null default '',
  staff_experience text not null default '',
  why_staff text not null default '',
  why_drill text not null default '',
  entry_quiz_result jsonb not null default '{}'::jsonb,
  core_quiz_result jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'accepted', 'rejected')),
  review_notes text not null default '',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.interview_applications enable row level security;

drop policy if exists "interview_applications_insert_public" on public.interview_applications;
create policy "interview_applications_insert_public"
on public.interview_applications for insert
to anon, authenticated
with check (
  status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "interview_applications_select_head_admin" on public.interview_applications;
create policy "interview_applications_select_head_admin"
on public.interview_applications for select
to authenticated
using (
  public.current_user_role() = 'head_admin'
  or public.current_user_has_god_key() = true
);

drop policy if exists "interview_applications_update_head_admin" on public.interview_applications;
create policy "interview_applications_update_head_admin"
on public.interview_applications for update
to authenticated
using (
  public.current_user_role() = 'head_admin'
  or public.current_user_has_god_key() = true
)
with check (
  public.current_user_role() = 'head_admin'
  or public.current_user_has_god_key() = true
);

alter table public.interview_applications
add column if not exists interview_scores jsonb not null default '[]'::jsonb;

alter table public.interview_applications
add column if not exists interview_total_score int not null default 0;

alter table public.interview_applications
add column if not exists interview_max_score int not null default 0;

alter table public.interview_applications
add column if not exists interview_started_by uuid references auth.users(id);

alter table public.interview_applications
add column if not exists interview_started_at timestamptz;

alter table public.interview_applications
add column if not exists interview_completed_at timestamptz;

create table if not exists public.interview_question_bank (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  question text not null,
  max_score int not null default 5,
  sort_order int not null default 0,
  good_answer_example text not null default '',
  bad_answer_example text not null default '',
  is_active boolean not null default true,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.interview_question_bank enable row level security;

create or replace function public.is_developer_account()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and lower(coalesce(email, '')) = 'justappletje@gmail.com'
  )
$$;

drop policy if exists "interview_question_bank_select_head_admin" on public.interview_question_bank;
create policy "interview_question_bank_select_head_admin"
on public.interview_question_bank for select
to authenticated
using (
  public.current_user_role() = 'head_admin'
  or public.current_user_has_god_key() = true
);

drop policy if exists "interview_question_bank_write_developer" on public.interview_question_bank;
create policy "interview_question_bank_write_developer"
on public.interview_question_bank for insert
to authenticated
with check (public.is_developer_account() = true);

drop policy if exists "interview_question_bank_update_developer" on public.interview_question_bank;
create policy "interview_question_bank_update_developer"
on public.interview_question_bank for update
to authenticated
using (public.is_developer_account() = true)
with check (public.is_developer_account() = true);

drop policy if exists "interview_question_bank_delete_developer" on public.interview_question_bank;
create policy "interview_question_bank_delete_developer"
on public.interview_question_bank for delete
to authenticated
using (public.is_developer_account() = true);


create table if not exists public.video_quizzes (
  id uuid primary key default gen_random_uuid(),
  quiz_key text unique not null,
  title text not null,
  description text not null default '',
  rank_key text,
  video_url text not null default '',
  watch_points jsonb not null default '[]'::jsonb,
  note_prompts jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.video_quizzes enable row level security;

drop policy if exists "video_quizzes_read_authenticated" on public.video_quizzes;
create policy "video_quizzes_read_authenticated"
on public.video_quizzes for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "video_quizzes_write_admin_head" on public.video_quizzes;
create policy "video_quizzes_write_admin_head"
on public.video_quizzes for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'head_admin')
  or public.current_user_has_god_key() = true
);

drop policy if exists "video_quizzes_update_admin_head" on public.video_quizzes;
create policy "video_quizzes_update_admin_head"
on public.video_quizzes for update
to authenticated
using (
  public.current_user_role() in ('admin', 'head_admin')
  or public.current_user_has_god_key() = true
)
with check (
  public.current_user_role() in ('admin', 'head_admin')
  or public.current_user_has_god_key() = true
);

drop policy if exists "video_quizzes_delete_admin_head" on public.video_quizzes;
create policy "video_quizzes_delete_admin_head"
on public.video_quizzes for delete
to authenticated
using (
  public.current_user_role() in ('admin', 'head_admin')
  or public.current_user_has_god_key() = true
);

alter table public.video_quizzes
add column if not exists scenes jsonb not null default '[]'::jsonb;

create table if not exists public.staff_essentials (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  section text not null default 'General',
  title text not null,
  summary text not null default '',
  cover_video_url text not null default '',
  tags jsonb not null default '[]'::jsonb,
  modules jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.staff_essentials enable row level security;

drop policy if exists "staff_essentials_read_authenticated" on public.staff_essentials;
create policy "staff_essentials_read_authenticated"
on public.staff_essentials for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "staff_essentials_write_head_admin" on public.staff_essentials;
create policy "staff_essentials_write_head_admin"
on public.staff_essentials for insert
to authenticated
with check (
  public.current_user_role() = 'head_admin'
  or public.current_user_has_god_key() = true
);

drop policy if exists "staff_essentials_update_head_admin" on public.staff_essentials;
create policy "staff_essentials_update_head_admin"
on public.staff_essentials for update
to authenticated
using (
  public.current_user_role() = 'head_admin'
  or public.current_user_has_god_key() = true
)
with check (
  public.current_user_role() = 'head_admin'
  or public.current_user_has_god_key() = true
);

drop policy if exists "staff_essentials_delete_head_admin" on public.staff_essentials;
create policy "staff_essentials_delete_head_admin"
on public.staff_essentials for delete
to authenticated
using (
  public.current_user_role() = 'head_admin'
  or public.current_user_has_god_key() = true
);

