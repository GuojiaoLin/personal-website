create table about_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null unique,
  portrait_image_url text not null default '',
  wechat_qr_image_url text not null default '',
  profile_details text not null default '[]',
  resume_entries text not null default '[]',
  contact_heading text not null default '',
  contact_items text not null default '[]',
  social_links text not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
