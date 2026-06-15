package com.guojiaolin.website.gallery.dto;

import com.guojiaolin.website.content.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GalleryPhotoRequest(
  @NotBlank
  @Size(max = 120)
  String title,

  @Size(max = 1000)
  String description,

  @Size(max = 120)
  String location,

  @Size(max = 40)
  String takenAt,

  Integer sortOrder,
  ContentStatus status
) {
}
