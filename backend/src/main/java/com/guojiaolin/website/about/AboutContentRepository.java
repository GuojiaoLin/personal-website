package com.guojiaolin.website.about;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AboutContentRepository extends JpaRepository<AboutContent, UUID> {

  Optional<AboutContent> findByContentKey(String contentKey);
}
