create extension if not exists pgcrypto;

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('OWNER')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  description_markdown text not null default '',
  cover_image_url text,
  tech_stack text not null default '[]',
  sort_order integer not null default 0,
  status text not null check (status in ('DRAFT', 'PUBLISHED', 'HIDDEN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_status_sort_idx
  on projects (status, sort_order asc, updated_at desc);

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  slug text not null unique,
  category text not null,
  summary text not null,
  content_markdown text not null,
  blog_order integer not null default 0,
  cover_image_url text,
  status text not null check (status in ('DRAFT', 'PUBLISHED', 'HIDDEN')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_status_order_idx
  on blog_posts (status, blog_order asc, published_at desc);

create index blog_posts_project_idx
  on blog_posts (project_id);

create table comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('BLOG', 'GUESTBOOK')),
  target_id uuid,
  parent_id uuid references comments(id) on delete cascade,
  author_name text not null,
  content text not null,
  status text not null check (status in ('PENDING', 'APPROVED', 'HIDDEN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_target_shape check (
    (target_type = 'BLOG' and target_id is not null)
    or
    (target_type = 'GUESTBOOK' and target_id is null)
  )
);

create index comments_target_status_idx
  on comments (target_type, target_id, status, created_at desc);

create index comments_parent_idx
  on comments (parent_id);

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);
