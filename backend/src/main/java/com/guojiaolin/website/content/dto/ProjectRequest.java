package com.guojiaolin.website.content.dto;

import com.guojiaolin.website.content.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ProjectRequest(
  @NotBlank @Size(max = 200) String title,
  @NotBlank @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$") String slug,
  @NotBlank @Size(max = 1000) String summary,
  String descriptionMarkdown,
  String coverImageUrl,
  String projectIcon,
  List<String> techStack,
  Integer sortOrder,
  ContentStatus status
) {
}
