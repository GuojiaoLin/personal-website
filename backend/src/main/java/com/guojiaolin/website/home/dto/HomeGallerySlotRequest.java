package com.guojiaolin.website.home.dto;

import jakarta.validation.Valid;
import java.util.List;

public record HomeGallerySlotRequest(
  List<@Valid HomeGallerySlotItemRequest> slots
) {
}
