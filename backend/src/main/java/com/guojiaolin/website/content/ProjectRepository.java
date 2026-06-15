package com.guojiaolin.website.content;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

  Optional<Project> findBySlugIgnoreCase(String slug);

  Optional<Project> findBySlugIgnoreCaseAndStatus(String slug, ContentStatus status);

  List<Project> findAllByStatus(ContentStatus status, Sort sort);

  boolean existsBySlugIgnoreCase(String slug);
}
