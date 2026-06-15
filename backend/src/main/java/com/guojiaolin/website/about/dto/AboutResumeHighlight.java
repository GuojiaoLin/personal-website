package com.guojiaolin.website.about.dto;

import jakarta.validation.constraints.NotBlank;

public record AboutResumeHighlight(
  @NotBlank String title,
  @NotBlank String detail
) {
}
