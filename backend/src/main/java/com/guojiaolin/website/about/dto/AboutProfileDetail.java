package com.guojiaolin.website.about.dto;

import jakarta.validation.constraints.NotBlank;

public record AboutProfileDetail(
  @NotBlank String label,
  @NotBlank String value,
  String icon,
  String copyValue,
  Boolean wide
) {
}
