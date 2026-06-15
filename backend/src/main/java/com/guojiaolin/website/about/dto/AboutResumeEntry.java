package com.guojiaolin.website.about.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record AboutResumeEntry(
  String category,
  @NotBlank String title,
  String meta,
  String period,
  List<String> techStack,
  String descriptionLabel,
  String description,
  String highlightsLabel,
  @Valid List<AboutResumeHighlight> highlights,
  Integer sortOrder
) {
}
