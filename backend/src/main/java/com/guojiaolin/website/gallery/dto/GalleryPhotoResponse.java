package com.guojiaolin.website.gallery.dto;

import com.guojiaolin.website.content.ContentStatus;
import com.guojiaolin.website.gallery.GalleryPhoto;
import java.time.Instant;
import java.util.UUID;
import org.springframework.util.StringUtils;

public record GalleryPhotoResponse(
  UUID id,
  String title,
  String description,
  String location,
  String takenAt,
  int sortOrder,
  ContentStatus status,
  String url,
  String thumbnailUrl,
  String mediumUrl,
  String fileName,
  String mimeType,
  long sizeBytes,
  Instant createdAt,
  Instant updatedAt
) {

  public static GalleryPhotoResponse from(GalleryPhoto photo) {
    return new GalleryPhotoResponse(
      photo.getId(),
      photo.getTitle(),
      photo.getDescription(),
      photo.getLocation(),
      photo.getTakenAt(),
      photo.getSortOrder(),
      photo.getStatus(),
      photo.getUrl(),
      StringUtils.hasText(photo.getThumbnailUrl()) ? photo.getThumbnailUrl() : photo.getUrl(),
      StringUtils.hasText(photo.getMediumUrl()) ? photo.getMediumUrl() : photo.getUrl(),
      photo.getFileName(),
      photo.getMimeType(),
      photo.getSizeBytes(),
      photo.getCreatedAt(),
      photo.getUpdatedAt()
    );
  }
}
