create table resume_versions (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index resume_versions_one_active_idx
  on resume_versions (active)
  where active;

create index resume_versions_active_updated_idx
  on resume_versions (active, updated_at desc);
