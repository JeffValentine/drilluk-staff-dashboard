-- Drill UK Staff Dashboard security patch
-- Paste this whole file into the Supabase SQL editor and run it once.

create extension if not exists pgcrypto;

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

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;
revoke all on function public.current_user_is_active() from public;
grant execute on function public.current_user_is_active() to authenticated;
revoke all on function public.current_user_can_access_dashboard() from public;
grant execute on function public.current_user_can_access_dashboard() to authenticated;
revoke all on function public.current_user_has_god_key() from public;
grant execute on function public.current_user_has_god_key() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provided_token text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'signup_token', '')), '');
begin
  if provided_token is null then
    raise exception 'Invite token is required';
  end if;

  insert into public.profiles (id, username, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    'viewer',
    false
  )
  on conflict (id) do nothing;

  update public.invite_tokens
  set used_at = now(),
      used_email = lower(new.email),
      used_by = new.id
  where token_hash in (
      md5(provided_token),
      encode(digest(provided_token, 'sha256'), 'hex')
    )
    and used_at is null
    and (expires_at is null or expires_at > now());

  if not found then
    raise exception 'Invalid or expired invite token';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.create_signup_token(valid_for_hours int default 168)
returns text
language plpgsql
security definer
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

create or replace function public.validate_signup_token(token_input text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_token text := nullif(trim(coalesce(token_input, '')), '');
begin
  if normalized_token is null or length(normalized_token) < 32 or length(normalized_token) > 128 then
    return false;
  end if;

  return exists (
    select 1
    from public.invite_tokens
    where token_hash in (
        md5(normalized_token),
        encode(digest(normalized_token, 'sha256'), 'hex')
      )
      and used_at is null
      and (expires_at is null or expires_at > now())
  );
end;
$$;

revoke all on function public.create_signup_token(int) from public;
grant execute on function public.create_signup_token(int) to authenticated;
revoke all on function public.validate_signup_token(text) from public;
grant execute on function public.validate_signup_token(text) to anon, authenticated;
drop function if exists public.consume_signup_token(text, text);

alter table public.profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.audit_logs enable row level security;
alter table public.checkbox_catalog enable row level security;
alter table public.rank_display_names enable row level security;
alter table public.invite_tokens enable row level security;
alter table public.managed_quiz_questions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_assignments enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
on public.profiles for select
using (id = auth.uid() or public.current_user_role() = 'head_admin');

drop policy if exists "profiles_head_admin_update" on public.profiles;
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

drop policy if exists "profiles_self_god_key_reset" on public.profiles;
create policy "profiles_self_god_key_reset"
on public.profiles for update
using (id = auth.uid() and god_key_enabled = true)
with check (
  id = auth.uid()
  and god_key_enabled = true
  and role = 'head_admin'
  and is_active = true
);

drop policy if exists "staff_read_authenticated" on public.staff_members;
create policy "staff_read_authenticated"
on public.staff_members for select
using (public.current_user_can_access_dashboard());

drop policy if exists "staff_write_trainer_admin" on public.staff_members;
create policy "staff_write_trainer_admin"
on public.staff_members for insert
with check (public.current_user_role() in ('trainer', 'admin', 'head_admin'));

drop policy if exists "staff_update_trainer_admin" on public.staff_members;
create policy "staff_update_trainer_admin"
on public.staff_members for update
using (public.current_user_role() in ('trainer', 'admin', 'head_admin'))
with check (public.current_user_role() in ('trainer', 'admin', 'head_admin'));

drop policy if exists "staff_update_own_training" on public.staff_members;
create policy "staff_update_own_training"
on public.staff_members for update
using (public.current_user_role() = 'staff_in_training' and trainee_user_id = auth.uid())
with check (public.current_user_role() = 'staff_in_training' and trainee_user_id = auth.uid());

drop policy if exists "staff_delete_admin_head" on public.staff_members;
create policy "staff_delete_admin_head"
on public.staff_members for delete
using (public.current_user_role() in ('admin', 'head_admin'));

drop policy if exists "audit_insert_authenticated" on public.audit_logs;
create policy "audit_insert_authenticated"
on public.audit_logs for insert
with check (
  public.current_user_can_access_dashboard()
  and actor_id = auth.uid()
);

drop policy if exists "audit_read_admin_head" on public.audit_logs;
create policy "audit_read_admin_head"
on public.audit_logs for select
using (public.current_user_role() in ('admin', 'head_admin'));

drop policy if exists "checkbox_catalog_read_authenticated" on public.checkbox_catalog;
create policy "checkbox_catalog_read_authenticated"
on public.checkbox_catalog for select
using (public.current_user_can_access_dashboard());

drop policy if exists "checkbox_catalog_write_admin_head" on public.checkbox_catalog;
create policy "checkbox_catalog_write_admin_head"
on public.checkbox_catalog for insert
with check (public.current_user_role() in ('admin', 'head_admin'));

drop policy if exists "checkbox_catalog_update_admin_head" on public.checkbox_catalog;
create policy "checkbox_catalog_update_admin_head"
on public.checkbox_catalog for update
using (public.current_user_role() in ('admin', 'head_admin'))
with check (public.current_user_role() in ('admin', 'head_admin'));

drop policy if exists "checkbox_catalog_delete_admin_head" on public.checkbox_catalog;
create policy "checkbox_catalog_delete_admin_head"
on public.checkbox_catalog for delete
using (public.current_user_role() in ('admin', 'head_admin'));

drop policy if exists "rank_display_read_authenticated" on public.rank_display_names;
create policy "rank_display_read_authenticated"
on public.rank_display_names for select
using (public.current_user_can_access_dashboard());

drop policy if exists "rank_display_write_authenticated" on public.rank_display_names;
drop policy if exists "rank_display_update_authenticated" on public.rank_display_names;
drop policy if exists "rank_display_write_admin_head" on public.rank_display_names;
create policy "rank_display_write_admin_head"
on public.rank_display_names for insert
to authenticated
with check (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "rank_display_update_admin_head" on public.rank_display_names;
create policy "rank_display_update_admin_head"
on public.rank_display_names for update
to authenticated
using (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true)
with check (public.current_user_role() in ('admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "rank_display_delete_admin_head" on public.rank_display_names;
create policy "rank_display_delete_admin_head"
on public.rank_display_names for delete
using (public.current_user_role() in ('admin', 'head_admin'));

delete from public.rank_display_names
where rank_key = 'anon-probe';

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
using (public.current_user_can_access_dashboard());

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

revoke all on function public.current_user_can_write_quiz_attempt(bigint) from public;
grant execute on function public.current_user_can_write_quiz_attempt(bigint) to authenticated;
revoke all on function public.current_user_can_write_quiz_attempt_answers(uuid) from public;
grant execute on function public.current_user_can_write_quiz_attempt_answers(uuid) to authenticated;

drop policy if exists "quizzes_read_authenticated" on public.quizzes;
create policy "quizzes_read_authenticated"
on public.quizzes for select
using (public.current_user_can_access_dashboard());

drop policy if exists "quiz_questions_read_authenticated" on public.quiz_questions;
create policy "quiz_questions_read_authenticated"
on public.quiz_questions for select
using (public.current_user_can_access_dashboard());

drop policy if exists "quiz_assignments_read_authenticated" on public.quiz_assignments;
create policy "quiz_assignments_read_authenticated"
on public.quiz_assignments for select
using (public.current_user_can_access_dashboard());

drop policy if exists "quiz_attempts_read_authenticated" on public.quiz_attempts;
create policy "quiz_attempts_read_authenticated"
on public.quiz_attempts for select
using (public.current_user_can_access_dashboard());

drop policy if exists "quiz_attempts_insert_authenticated" on public.quiz_attempts;
create policy "quiz_attempts_insert_authenticated"
on public.quiz_attempts for insert
with check (public.current_user_can_write_quiz_attempt(staff_member_id));

drop policy if exists "quiz_attempts_update_admin_head" on public.quiz_attempts;
create policy "quiz_attempts_update_admin_head"
on public.quiz_attempts for update
using (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true)
with check (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quiz_attempt_answers_read_authenticated" on public.quiz_attempt_answers;
create policy "quiz_attempt_answers_read_authenticated"
on public.quiz_attempt_answers for select
using (public.current_user_can_access_dashboard());

drop policy if exists "quiz_attempt_answers_insert_authenticated" on public.quiz_attempt_answers;
create policy "quiz_attempt_answers_insert_authenticated"
on public.quiz_attempt_answers for insert
with check (public.current_user_can_write_quiz_attempt_answers(attempt_id));

drop policy if exists "quiz_attempt_answers_delete_trainer_admin" on public.quiz_attempt_answers;
create policy "quiz_attempt_answers_delete_trainer_admin"
on public.quiz_attempt_answers for delete
using (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true);

drop policy if exists "quiz_attempt_answers_update_admin_head" on public.quiz_attempt_answers;
create policy "quiz_attempt_answers_update_admin_head"
on public.quiz_attempt_answers for update
using (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true)
with check (public.current_user_role() in ('trainer', 'admin', 'head_admin') or public.current_user_has_god_key() = true);

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

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'interview_applications_age_range') then
    alter table public.interview_applications
    add constraint interview_applications_age_range
    check (age between 13 and 100) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'interview_applications_hours_range') then
    alter table public.interview_applications
    add constraint interview_applications_hours_range
    check (hours_per_week between 1 and 168) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'interview_applications_public_text_size') then
    alter table public.interview_applications
    add constraint interview_applications_public_text_size
    check (
      length(trim(full_name)) between 2 and 120
      and length(trim(discord_name)) between 2 and 120
      and length(trim(country)) between 2 and 80
      and length(prior_bans) <= 1500
      and length(staff_experience) <= 2500
      and length(why_staff) between 10 and 2500
      and length(why_drill) between 10 and 2500
    ) not valid;
  end if;
end;
$$;

create or replace function public.can_submit_interview_application(discord_value text)
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

revoke all on function public.can_submit_interview_application(text) from public;
grant execute on function public.can_submit_interview_application(text) to anon, authenticated;

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
  and public.can_submit_interview_application(discord_name)
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

drop policy if exists "video_quizzes_read_authenticated" on public.video_quizzes;
create policy "video_quizzes_read_authenticated"
on public.video_quizzes for select
to authenticated
using (public.current_user_can_access_dashboard());

drop policy if exists "staff_essentials_read_authenticated" on public.staff_essentials;
create policy "staff_essentials_read_authenticated"
on public.staff_essentials for select
to authenticated
using (public.current_user_can_access_dashboard());

drop policy if exists "affiliate_profiles_read_authenticated" on public.affiliate_profiles;
create policy "affiliate_profiles_read_authenticated"
on public.affiliate_profiles for select
to authenticated
using (public.current_user_can_access_dashboard());

drop policy if exists "affiliate_stat_snapshots_read_authenticated" on public.affiliate_stat_snapshots;
create policy "affiliate_stat_snapshots_read_authenticated"
on public.affiliate_stat_snapshots for select
to authenticated
using (public.current_user_can_access_dashboard());

drop policy if exists "risk_player_uploads_read_authenticated" on public.risk_player_uploads;
create policy "risk_player_uploads_read_authenticated"
on public.risk_player_uploads for select
to authenticated
using (public.current_user_can_access_dashboard());

insert into storage.buckets (id, name, public)
values ('staff-cards', 'staff-cards', true)
on conflict (id) do update set public = true;

drop policy if exists "staff_cards_public_read" on storage.objects;
create policy "staff_cards_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'staff-cards');

drop policy if exists "staff_cards_authenticated_upload" on storage.objects;
create policy "staff_cards_authenticated_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'staff-cards'
  and (
    public.current_user_role() in ('trainer', 'admin', 'head_admin')
    or public.current_user_has_god_key() = true
  )
);

drop policy if exists "staff_cards_authenticated_update" on storage.objects;
create policy "staff_cards_authenticated_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'staff-cards'
  and (
    public.current_user_role() in ('trainer', 'admin', 'head_admin')
    or public.current_user_has_god_key() = true
  )
)
with check (
  bucket_id = 'staff-cards'
  and (
    public.current_user_role() in ('trainer', 'admin', 'head_admin')
    or public.current_user_has_god_key() = true
  )
);

drop policy if exists "staff_cards_authenticated_delete" on storage.objects;
create policy "staff_cards_authenticated_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'staff-cards'
  and (
    public.current_user_role() in ('admin', 'head_admin')
    or public.current_user_has_god_key() = true
  )
);
