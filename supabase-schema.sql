-- Maxspect UK — Supabase schema migration
-- Run once in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Idempotent: safe to re-run.

create table if not exists public.product_categories (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  sort_order integer default 0
);

create table if not exists public.products (
  id text primary key,
  category_id text references public.product_categories(id) on delete set null,
  series_id text,
  slug text unique not null,
  title text not null,
  subtitle text,
  hero_image text,
  hero_badge text,
  gallery_images jsonb default '[]'::jsonb,
  sections jsonb default '[]'::jsonb,
  features jsonb default '[]'::jsonb,
  specs jsonb default '{}'::jsonb,
  downloads jsonb default '[]'::jsonb,
  status text default 'draft',
  source_url text,
  last_scraped_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.stockists (
  id text primary key,
  name text not null,
  slug text unique not null,
  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  country text,
  phone text,
  email text,
  website text,
  latitude double precision,
  longitude double precision,
  is_verified_dealer boolean default false,
  tier text default 'Standard',
  opening_hours jsonb default '{}'::jsonb
);

create table if not exists public.spare_parts (
  id text primary key,
  product_page_id text,
  series_slug text,
  sku text unique not null,
  name text not null,
  description text,
  price_gbp numeric default 0,
  image_url text,
  in_stock boolean default true,
  stock_count integer default 0,
  compatibility jsonb default '[]'::jsonb
);

create table if not exists public.media_assets (
  id text primary key,
  source_url text unique not null,
  storage_path text not null,
  public_url text not null,
  content_type text,
  size_bytes bigint,
  created_at timestamptz default now()
);

create table if not exists public.review_flags (
  id text primary key,
  slug text not null,
  pane text not null,
  category text not null,
  note text not null,
  resolved boolean default false,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create index if not exists review_flags_slug_idx on public.review_flags(slug);
create index if not exists review_flags_resolved_idx on public.review_flags(resolved);

-- Enable RLS but allow public read on published content (no auth on this site yet).
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.stockists enable row level security;
alter table public.spare_parts enable row level security;
alter table public.media_assets enable row level security;

-- Public read policies (idempotent: drop if exists before creating).
drop policy if exists "public read categories" on public.product_categories;
create policy "public read categories" on public.product_categories for select using (true);

-- Allow reading both published and draft products so synced drafts render on the
-- preview/admin path. The service_role key bypasses RLS for admin writes.
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (status in ('published','draft'));

drop policy if exists "public read stockists" on public.stockists;
create policy "public read stockists" on public.stockists for select using (true);

drop policy if exists "public read spares" on public.spare_parts;
create policy "public read spares" on public.spare_parts for select using (true);

drop policy if exists "public read media" on public.media_assets;
create policy "public read media" on public.media_assets for select using (true);

alter table public.review_flags enable row level security;
drop policy if exists "public read review_flags" on public.review_flags;
create policy "public read review_flags" on public.review_flags for select using (true);

-- The service_role key bypasses RLS entirely, so admin writes work without extra policies.
