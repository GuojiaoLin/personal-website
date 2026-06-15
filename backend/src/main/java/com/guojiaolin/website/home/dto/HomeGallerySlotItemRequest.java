package com.guojiaolin.website.home.dto;

import java.util.UUID;

public record HomeGallerySlotItemRequest(
  String slotKey,
  UUID galleryPhotoId
) {
}
