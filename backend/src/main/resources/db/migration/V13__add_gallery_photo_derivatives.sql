alter table gallery_photos
  add column thumbnail_url text not null default '',
  add column medium_url text not null default '';

update gallery_photos
set thumbnail_url = url
where thumbnail_url = '';

update gallery_photos
set medium_url = url
where medium_url = '';
