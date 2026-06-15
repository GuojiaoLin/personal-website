package com.guojiaolin.website.content;

import com.guojiaolin.website.common.BadRequestException;
import com.guojiaolin.website.common.NotFoundException;
import com.guojiaolin.website.content.dto.ProjectRequest;
import com.guojiaolin.website.content.dto.ProjectResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {

  private static final Sort PROJECT_SORT = Sort.by("sortOrder").ascending().and(Sort.by("updatedAt").descending());

  private final ProjectRepository projects;
  private final JsonListMapper jsonListMapper;

  public ProjectService(ProjectRepository projects, JsonListMapper jsonListMapper) {
    this.projects = projects;
    this.jsonListMapper = jsonListMapper;
  }

  @Transactional(readOnly = true)
  public List<ProjectResponse> listPublished() {
    return projects.findAllByStatus(ContentStatus.PUBLISHED, PROJECT_SORT).stream()
      .map(project -> ProjectResponse.from(project, jsonListMapper))
      .toList();
  }

  @Transactional(readOnly = true)
  public ProjectResponse getPublished(String slug) {
    return ProjectResponse.from(findPublishedBySlug(slug), jsonListMapper);
  }

  @Transactional(readOnly = true)
  public List<ProjectResponse> listAdmin() {
    return projects.findAll(PROJECT_SORT).stream()
      .map(project -> ProjectResponse.from(project, jsonListMapper))
      .toList();
  }

  @Transactional
  public ProjectResponse create(ProjectRequest request) {
    if (projects.existsBySlugIgnoreCase(request.slug())) {
      throw new BadRequestException("Project slug already exists.");
    }

    var project = new Project();
    apply(project, request);
    return ProjectResponse.from(projects.save(project), jsonListMapper);
  }

  @Transactional
  public ProjectResponse update(UUID id, ProjectRequest request) {
    var project = projects.findById(id)
      .orElseThrow(() -> new NotFoundException("Project not found."));

    projects.findBySlugIgnoreCase(request.slug())
      .filter(existing -> !existing.getId().equals(id))
      .ifPresent(existing -> {
        throw new BadRequestException("Project slug already exists.");
      });

    apply(project, request);
    return ProjectResponse.from(project, jsonListMapper);
  }

  @Transactional
  public void delete(UUID id) {
    if (!projects.existsById(id)) {
      throw new NotFoundException("Project not found.");
    }
    projects.deleteById(id);
  }

  @Transactional(readOnly = true)
  public Project findById(UUID id) {
    return projects.findById(id)
      .orElseThrow(() -> new NotFoundException("Project not found."));
  }

  @Transactional(readOnly = true)
  public Project findPublishedBySlug(String slug) {
    return projects.findBySlugIgnoreCaseAndStatus(slug, ContentStatus.PUBLISHED)
      .orElseThrow(() -> new NotFoundException("Project not found."));
  }

  private void apply(Project project, ProjectRequest request) {
    project.setTitle(request.title().trim());
    project.setSlug(request.slug().trim().toLowerCase());
    project.setSummary(request.summary().trim());
    project.setDescriptionMarkdown(clean(request.descriptionMarkdown()));
    project.setCoverImageUrl(blankToNull(request.coverImageUrl()));
    project.setProjectIcon(blankToNull(request.projectIcon()));
    project.setTechStack(jsonListMapper.toJson(request.techStack()));
    project.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
    project.setStatus(request.status() == null ? ContentStatus.DRAFT : request.status());
  }

  private String clean(String value) {
    return value == null ? "" : value.trim();
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }
}
