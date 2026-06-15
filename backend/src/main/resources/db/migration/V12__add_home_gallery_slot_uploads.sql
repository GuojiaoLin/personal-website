alter table home_gallery_slots
  add column uploaded_image_url text,
  add column uploaded_file_name text,
  add column uploaded_mime_type text,
  add column uploaded_size_bytes bigint;
