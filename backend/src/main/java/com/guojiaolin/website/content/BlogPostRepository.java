package com.guojiaolin.website.content;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlogPostRepository extends JpaRepository<BlogPost, UUID> {

  Optional<BlogPost> findBySlugIgnoreCase(String slug);

  Optional<BlogPost> findBySlugIgnoreCaseAndStatus(String slug, ContentStatus status);

  Optional<BlogPost> findByProject_IdAndSlugIgnoreCase(UUID projectId, String slug);

  Optional<BlogPost> findByProject_SlugIgnoreCaseAndSlugIgnoreCaseAndStatus(
    String projectSlug,
    String slug,
    ContentStatus status
  );

  List<BlogPost> findAllByStatus(ContentStatus status, Sort sort);

  List<BlogPost> findAllByStatusAndFeaturedOnHome(ContentStatus status, boolean featuredOnHome, Sort sort);

  boolean existsByProject_IdAndSlugIgnoreCase(UUID projectId, String slug);
}
