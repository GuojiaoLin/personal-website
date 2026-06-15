create table home_gallery_slots (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null unique,
  gallery_photo_id uuid references gallery_photos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index home_gallery_slots_photo_idx
  on home_gallery_slots (gallery_photo_id);
