package com.guojiaolin.website.gallery;

import com.guojiaolin.website.content.ContentStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface GalleryPhotoRepository extends JpaRepository<GalleryPhoto, UUID> {

  List<GalleryPhoto> findAllByStatus(ContentStatus status, Sort sort);

  boolean existsByFileName(String fileName);

  @Query("select coalesce(max(photo.sortOrder), 0) from GalleryPhoto photo")
  int findMaxSortOrder();
}
