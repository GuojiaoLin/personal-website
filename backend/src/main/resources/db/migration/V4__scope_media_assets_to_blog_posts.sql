alter table media_assets
  add column blog_post_id uuid references blog_posts(id) on delete cascade;

create index media_assets_blog_post_created_idx
  on media_assets (blog_post_id, created_at desc);
