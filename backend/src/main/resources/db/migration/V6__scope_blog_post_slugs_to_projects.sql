alter table blog_posts
  drop constraint if exists blog_posts_slug_key;

create unique index if not exists blog_posts_project_slug_idx
  on blog_posts (project_id, slug);
