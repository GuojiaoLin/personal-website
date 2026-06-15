alter table blog_posts
  add column featured_on_home boolean not null default false,
  add column home_order integer not null default 0;

update blog_posts
set featured_on_home = true,
    home_order = blog_order
where status = 'PUBLISHED';

create index blog_posts_home_featured_idx
  on blog_posts (status, featured_on_home, home_order asc, published_at desc);
