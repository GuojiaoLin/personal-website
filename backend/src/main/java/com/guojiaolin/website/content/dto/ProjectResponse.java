package com.guojiaolin.website.content.dto;

import com.guojiaolin.website.content.ContentStatus;
import com.guojiaolin.website.content.JsonListMapper;
import com.guojiaolin.website.content.Project;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProjectResponse(
  UUID id,
  String title,
  String slug,
  String summary,
  String descriptionMarkdown,
  String coverImageUrl,
  String projectIcon,
  List<String> techStack,
  int sortOrder,
  ContentStatus status,
  Instant createdAt,
  Instant updatedAt
) {

  public static ProjectResponse from(Project project, JsonListMapper jsonListMapper) {
    return new ProjectResponse(
      project.getId(),
      project.getTitle(),
      project.getSlug(),
      project.getSummary(),
      project.getDescriptionMarkdown(),
      project.getCoverImageUrl(),
      project.getProjectIcon(),
      jsonListMapper.fromJson(project.getTechStack()),
      project.getSortOrder(),
      project.getStatus(),
      project.getCreatedAt(),
      project.getUpdatedAt()
    );
  }
}
