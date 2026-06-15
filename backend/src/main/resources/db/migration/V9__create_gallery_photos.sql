create table gallery_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location text not null default '',
  taken_at text not null default '',
  sort_order integer not null default 0,
  status text not null check (status in ('DRAFT', 'PUBLISHED', 'HIDDEN')),
  url text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gallery_photos_status_sort_idx
  on gallery_photos (status, sort_order asc, updated_at desc);
