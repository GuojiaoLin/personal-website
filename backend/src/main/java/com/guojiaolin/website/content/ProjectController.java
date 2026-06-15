package com.guojiaolin.website.content;

import com.guojiaolin.website.common.ListResponse;
import com.guojiaolin.website.content.dto.ProjectAssetResponse;
import com.guojiaolin.website.content.dto.ProjectRequest;
import com.guojiaolin.website.content.dto.ProjectResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class ProjectController {

  private final ProjectService projects;
  private final ProjectAssetService projectAssets;

  public ProjectController(ProjectService projects, ProjectAssetService projectAssets) {
    this.projects = projects;
    this.projectAssets = projectAssets;
  }

  @GetMapping("/api/projects")
  public ListResponse<ProjectResponse> listPublished() {
    return new ListResponse<>(projects.listPublished());
  }

  @GetMapping("/api/projects/{slug}")
  public ProjectResponse getPublished(@PathVariable String slug) {
    return projects.getPublished(slug);
  }

  @GetMapping("/api/admin/projects")
  public ListResponse<ProjectResponse> listAdmin() {
    return new ListResponse<>(projects.listAdmin());
  }

  @PostMapping("/api/admin/projects")
  public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectRequest request) {
    return ResponseEntity.status(201).body(projects.create(request));
  }

  @PostMapping(value = "/api/admin/projects/assets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ProjectAssetResponse> uploadAsset(@RequestParam("file") MultipartFile file) {
    return ResponseEntity.status(201).body(projectAssets.upload(file));
  }

  @PutMapping("/api/admin/projects/{id}")
  public ProjectResponse update(@PathVariable UUID id, @Valid @RequestBody ProjectRequest request) {
    return projects.update(id, request);
  }

  @DeleteMapping("/api/admin/projects/{id}")
  public ResponseEntity<Void> delete(@PathVariable UUID id) {
    projects.delete(id);
    return ResponseEntity.noContent().build();
  }
}
