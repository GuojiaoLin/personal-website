package com.guojiaolin.website.home.dto;

import com.guojiaolin.website.content.ContentStatus;
import com.guojiaolin.website.gallery.GalleryPhoto;
import com.guojiaolin.website.home.HomeGallerySlot;
import java.time.Instant;
import java.util.UUID;
import org.springframework.util.StringUtils;

public record HomeGallerySlotPhotoResponse(
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

  public static HomeGallerySlotPhotoResponse fromGallery(GalleryPhoto photo) {
    return new HomeGallerySlotPhotoResponse(
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

  public static HomeGallerySlotPhotoResponse fromUpload(HomeGallerySlot slot, String title) {
    return new HomeGallerySlotPhotoResponse(
      null,
      title,
      "",
      "首页展示",
      "",
      0,
      ContentStatus.PUBLISHED,
      slot.getUploadedImageUrl(),
      slot.getUploadedImageUrl(),
      slot.getUploadedImageUrl(),
      slot.getUploadedFileName(),
      slot.getUploadedMimeType(),
      slot.getUploadedSizeBytes() == null ? 0 : slot.getUploadedSizeBytes(),
      slot.getCreatedAt(),
      slot.getUpdatedAt()
    );
  }
}
