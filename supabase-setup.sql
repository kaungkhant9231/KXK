-- ============================================================
-- KXK Personal Website — Posts feature (Supabase setup)
--
-- ဘယ်လိုသုံးမလဲ:
--   1. supabase.com → Dashboard → မင်း project ထဲဝင်ပါ
--   2. SQL Editor → New query
--   3. ဒီအောက်က code တစ်ခုလုံး copy လုပ်ပြီး paste လုပ်ပါ
--   4. Run နှိပ်ပါ (အမှားတစ်ခုခုပေါ်ရင် အဲ့ဒီအကြောင်း ပြောပြပါ)
-- ============================================================

-- 1) Posts table — post တွေ သိမ်းမယ့် နေရာ
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

-- Row Level Security ဖွင့်ပါ
alter table public.posts enable row level security;

-- လူတိုင်း (visitor တွေ) post ဖတ်လို့ရမယ် — public feed
create policy "posts_public_read"
  on public.posts for select
  using (true);

-- Login ဝင်ထားတဲ့ မင်းပဲ post တင်လို့ရမယ်
create policy "posts_owner_insert"
  on public.posts for insert
  with check (auth.role() = 'authenticated');

-- Login ဝင်ထားတဲ့ မင်းပဲ post ဖျက်လို့ရမယ်
create policy "posts_owner_delete"
  on public.posts for delete
  using (auth.role() = 'authenticated');

-- အသစ်ဆုံး post က အပေါ်ဆုံး (speed အတွက်)
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- 2) Post ပုံတွေ အတွက် Storage bucket
--    (public bucket — ပုံ URL ကို လူတိုင်း ကြည့်လို့ရ)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- ပုံ ဖတ်လို့ရမယ်
create policy "post_images_public_read"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- Login ဝင်ထားမှ ပုံတင်လို့ရမယ်
create policy "post_images_owner_upload"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

-- Login ဝင်ထားမှ ပုံဖျက်လို့ရမယ်
create policy "post_images_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'post-images' and auth.role() = 'authenticated');
