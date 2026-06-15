package com.guojiaolin.website.resume;

import com.guojiaolin.website.common.ListResponse;
import com.guojiaolin.website.resume.dto.ResumeVersionResponse;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class ResumeVersionController {

  private final ResumeVersionService resumeVersions;

  public ResumeVersionController(ResumeVersionService resumeVersions) {
    this.resumeVersions = resumeVersions;
  }

  @GetMapping("/api/resume")
  public ResumeVersionResponse getActive() {
    return resumeVersions.getActive();
  }

  @GetMapping("/api/admin/resume-versions")
  public ListResponse<ResumeVersionResponse> listAdmin() {
    return new ListResponse<>(resumeVersions.listAdmin());
  }

  @PostMapping(value = "/api/admin/resume-versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ResumeVersionResponse> upload(
    @RequestParam("file") MultipartFile file,
    @RequestParam("label") String label
  ) {
    return ResponseEntity.status(201).body(resumeVersions.upload(file, label));
  }

  @PutMapping("/api/admin/resume-versions/{id}/activate")
  public ResumeVersionResponse activate(@PathVariable UUID id) {
    return resumeVersions.activate(id);
  }

  @DeleteMapping("/api/admin/resume-versions/{id}")
  public ResponseEntity<Void> delete(@PathVariable UUID id) {
    resumeVersions.delete(id);
    return ResponseEntity.noContent().build();
  }
}
