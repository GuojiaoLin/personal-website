package com.guojiaolin.website.media;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, UUID> {

  List<MediaAsset> findAllByBlogPost_Id(UUID blogPostId, Sort sort);
}
