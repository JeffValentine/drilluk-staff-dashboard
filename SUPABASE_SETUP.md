# Supabase Setup

1. Create a Supabase project.
2. In SQL editor, run: `supabase/schema.sql`.
3. Copy `.env.example` to `.env` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Install dependencies:
   - `npm install`
5. Start app:
   - `npm run dev`

## Make Yourself Head Admin

After your account signs up/signs in once, run this SQL (replace email):

```sql
update public.profiles
set role = 'head_admin', is_active = true
where id = (select id from auth.users where email = 'you@example.com');
```

## If You Already Ran An Older Schema

Run this once:

```sql
alter table public.profiles add column if not exists avatar_url text;

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

alter table public.checkbox_catalog enable row level security;

create policy "checkbox_catalog_read_authenticated"
on public.checkbox_catalog for select
using (auth.uid() is not null);

create policy "checkbox_catalog_write_admin_head"
on public.checkbox_catalog for insert
with check ((select role from public.profiles where id = auth.uid()) in ('admin', 'head_admin'));

create policy "checkbox_catalog_update_admin_head"
on public.checkbox_catalog for update
using ((select role from public.profiles where id = auth.uid()) in ('admin', 'head_admin'))
with check ((select role from public.profiles where id = auth.uid()) in ('admin', 'head_admin'));

create policy "checkbox_catalog_delete_admin_head"
on public.checkbox_catalog for delete
using ((select role from public.profiles where id = auth.uid()) in ('admin', 'head_admin'));
```

## Access Model

- `head_admin`: full access + management tab role controls
- `admin`: can edit staff, cannot manage user roles
- `trainer`: can edit training/staff content
- `viewer`: read-only dashboard
