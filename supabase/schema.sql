create extension if not exists "pgcrypto";

create table if not exists public.users (
  id text primary key,
  email text not null unique,
  campus_id uuid,
  display_name text not null,
  avatar_url text,
  bio text,
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login timestamptz,
  style_vibes text[] not null default '{}',
  favorite_colors text[] not null default '{}',
  sizing_profile jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb
);

create index if not exists users_campus_id_idx on public.users (campus_id);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id text not null references public.users(id) on delete cascade,
  campus_id uuid,
  title text not null,
  description text not null,
  category text not null,
  size text not null,
  condition text not null,
  price numeric,
  swap_value numeric,
  status text not null default 'active',
  ai_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_campus_id_idx on public.listings (campus_id);
create index if not exists listings_seller_id_idx on public.listings (seller_id);
create index if not exists listings_status_idx on public.listings (status);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_images_listing_id_idx on public.listing_images (listing_id);
