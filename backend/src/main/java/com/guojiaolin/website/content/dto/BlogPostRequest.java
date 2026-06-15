package com.guojiaolin.website.content.dto;

import com.guojiaolin.website.content.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record BlogPostRequest(
  @NotNull UUID projectId,
  @NotBlank @Size(max = 240) String title,
  @NotBlank @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$") String slug,
  @NotBlank @Size(max = 120) String category,
  @NotBlank @Size(max = 1000) String summary,
  @NotBlank String contentMarkdown,
  Integer blogOrder,
  Boolean featuredOnHome,
  Integer homeOrder,
  String coverImageUrl,
  ContentStatus status
) {
}
