-- ============================================================
-- KXK Site — V2: user accounts, profiles, likes, comments, admin
--
-- ဘယ်လိုသုံးမလဲ:
--   1. supabase.com → Dashboard → မင်း project (KXK)
--   2. SQL Editor → New query
--   3. ဒီ code တစ်ခုလုံး copy + paste + Run
--   4. v1 (supabase-setup.sql) ပြီးပြီးသားဖြစ်ရပါမယ်
-- ============================================================

-- 1) PROFILES — user တစ်ယောက်ချင်းစီရဲ့ အချက်အလက် (auth user တိုင်းမှာ row တစ်ခု)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  bio text not null default '',
  avatar_url text,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Signup လုပ်တိုင်း profile row ကို အလိုအလျောက် ဖန်တီးပေးမယ်
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'user') || '-' || substr(new.id::text, 1, 6),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) POSTS — author (user_id) column ထည့်ပါ (v1 table ရှိပြီးသား)
alter table public.posts add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- အရင်က post တွေက admin ပိုင်အဖြစ် backfill
update public.posts set user_id = (select id from auth.users where email = 'kxk@admin.com')
where user_id is null;

alter table public.posts alter column user_id set not null;
create index if not exists posts_user_id_idx on public.posts (user_id);

-- 3) LIKES — post တစ်ခုကို user တစ်ယောက် like တစ်ခါပဲ
create table if not exists public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- 4) COMMENTS
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_id_idx on public.comments (post_id);

-- 5) ADMIN / BANNED helper functions (RLS policies ထဲမှာ သုံးမယ်)
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_banned()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_banned from public.profiles where id = auth.uid()), false)
$$;

-- 6) ROW LEVEL SECURITY — policies အကုန်
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- v1 က policy အဟောင်းတွေ ဖျက်
drop policy if exists posts_owner_insert on public.posts;
drop policy if exists posts_owner_delete on public.posts;

-- PROFILES
drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read on public.profiles for select using (true);

drop policy if exists profiles_own_insert on public.profiles;
create policy profiles_own_insert on public.profiles for insert with check (id = auth.uid());

drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update on public.profiles for update
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles for delete using (public.is_admin());

-- POSTS
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select using (true);

drop policy if exists posts_auth_insert on public.posts;
create policy posts_auth_insert on public.posts for insert
  with check (auth.uid() is not null and not public.is_banned() and user_id = auth.uid());

drop policy if exists posts_own_update on public.posts;
create policy posts_own_update on public.posts for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists posts_own_delete on public.posts;
create policy posts_own_delete on public.posts for delete
  using (auth.uid() = user_id or public.is_admin());

-- LIKES
drop policy if exists likes_public_read on public.likes;
create policy likes_public_read on public.likes for select using (true);

drop policy if exists likes_auth_insert on public.likes;
create policy likes_auth_insert on public.likes for insert
  with check (auth.uid() is not null and not public.is_banned() and user_id = auth.uid());

drop policy if exists likes_own_delete on public.likes;
create policy likes_own_delete on public.likes for delete
  using (auth.uid() = user_id or public.is_admin());

-- COMMENTS
drop policy if exists comments_public_read on public.comments;
create policy comments_public_read on public.comments for select using (true);

drop policy if exists comments_auth_insert on public.comments;
create policy comments_auth_insert on public.comments for insert
  with check (auth.uid() is not null and not public.is_banned() and user_id = auth.uid());

drop policy if exists comments_own_delete on public.comments;
create policy comments_own_delete on public.comments for delete
  using (auth.uid() = user_id or public.is_admin());

-- 7) AVATAR STORAGE — profile ပုံတွေအတွက် (user တစ်ယောက်ချင်း ကိုယ့် folder ထဲပဲ)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists avatars_auth_upload on storage.objects;
create policy avatars_auth_upload on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_own_delete on storage.objects;
create policy avatars_own_delete on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 8) ADMIN SEED — kxk@admin.com ကို admin အဖြစ် သတ်မှတ်ပါ
insert into public.profiles (id, username, display_name, is_admin)
select id, 'kxk', 'Kaung Khant', true
from auth.users
where email = 'kxk@admin.com'
on conflict (id) do update set is_admin = true;

-- အောင်မြင်ကြောင်း စစ်ကြည့်ရန် (Run ပြီးရင် ဒီ query က row ၁ ခု ပြရမယ်)
select p.display_name, p.username, p.is_admin, p.is_banned
from public.profiles p
where p.is_admin = true;
