-- BRICK & BEYOND SHARED REVIEW DATABASE SETUP
-- Run this entire file once in Supabase: SQL Editor > New query > Run.

-- 1. Create the public reviews table.
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  reviewer_name text not null check (char_length(reviewer_name) between 1 and 60),
  rating smallint not null check (rating between 1 and 5),
  review_text text not null check (char_length(review_text) between 1 and 700),
  photo_url text,
  created_at timestamptz not null default now()
);

-- 2. Enable Row Level Security.
alter table public.reviews enable row level security;

-- 3. Remove old policies so this script can safely be run again.
drop policy if exists "Everyone can read reviews" on public.reviews;
drop policy if exists "Everyone can submit reviews" on public.reviews;

-- 4. Allow website visitors to read and submit reviews only.
create policy "Everyone can read reviews"
on public.reviews for select
to anon
using (true);

create policy "Everyone can submit reviews"
on public.reviews for insert
to anon
with check (
  rating between 1 and 5
  and char_length(reviewer_name) between 1 and 60
  and char_length(review_text) between 1 and 700
);

grant select, insert on public.reviews to anon;
grant usage, select on sequence public.reviews_id_seq to anon;

-- 5. Create the public bucket for optional review pictures.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-photos',
  'review-photos',
  true,
  1572864,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 6. Allow public viewing and new uploads, but not public deletion/changes.
drop policy if exists "Everyone can view review photos" on storage.objects;
drop policy if exists "Everyone can upload review photos" on storage.objects;

create policy "Everyone can view review photos"
on storage.objects for select
to public
using (bucket_id = 'review-photos');

create policy "Everyone can upload review photos"
on storage.objects for insert
to anon
with check (
  bucket_id = 'review-photos'
  and (storage.foldername(name))[1] = 'public'
);
