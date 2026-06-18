package com.guojiaolin.website.content;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlogPostRepository extends JpaRepository<BlogPost, UUID> {

  Optional<BlogPost> findBySlugIgnoreCase(String slug);

  Optional<BlogPost> findBySlugIgnoreCaseAndStatusAndProject_Status(
    String slug,
    ContentStatus status,
    ContentStatus projectStatus
  );

  Optional<BlogPost> findByProject_IdAndSlugIgnoreCase(UUID projectId, String slug);

  Optional<BlogPost> findByProject_SlugIgnoreCaseAndSlugIgnoreCaseAndStatusAndProject_Status(
    String projectSlug,
    String slug,
    ContentStatus status,
    ContentStatus projectStatus
  );

  List<BlogPost> findAllByStatusAndProject_Status(ContentStatus status, ContentStatus projectStatus, Sort sort);

  List<BlogPost> findAllByStatusAndFeaturedOnHomeAndProject_Status(
    ContentStatus status,
    boolean featuredOnHome,
    ContentStatus projectStatus,
    Sort sort
  );

  boolean existsByProject_IdAndSlugIgnoreCase(UUID projectId, String slug);
}
