package com.guojiaolin.website.resume.dto;

import com.guojiaolin.website.resume.ResumeVersion;
import java.time.Instant;
import java.util.UUID;

public record ResumeVersionResponse(
  UUID id,
  String label,
  String url,
  String fileName,
  String mimeType,
  long sizeBytes,
  boolean active,
  Instant createdAt,
  Instant updatedAt
) {

  public static ResumeVersionResponse from(ResumeVersion version) {
    return new ResumeVersionResponse(
      version.getId(),
      version.getLabel(),
      version.getUrl(),
      version.getFileName(),
      version.getMimeType(),
      version.getSizeBytes(),
      version.isActive(),
      version.getCreatedAt(),
      version.getUpdatedAt()
    );
  }
}
