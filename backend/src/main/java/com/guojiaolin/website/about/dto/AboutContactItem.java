package com.guojiaolin.website.about.dto;

import jakarta.validation.constraints.NotBlank;

public record AboutContactItem(
  @NotBlank String label,
  @NotBlank String value,
  String icon
) {
}
