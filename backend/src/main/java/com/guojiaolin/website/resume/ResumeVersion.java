package com.guojiaolin.website.resume;

import com.guojiaolin.website.common.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "resume_versions")
public class ResumeVersion extends AuditedEntity {

  @Column(nullable = false)
  private String label;

  @Column(nullable = false)
  private String url;

  @Column(nullable = false)
  private String fileName;

  @Column(nullable = false)
  private String mimeType;

  @Column(nullable = false)
  private long sizeBytes;

  @Column(nullable = false)
  private boolean active = false;

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getFileName() {
    return fileName;
  }

  public void setFileName(String fileName) {
    this.fileName = fileName;
  }

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public long getSizeBytes() {
    return sizeBytes;
  }

  public void setSizeBytes(long sizeBytes) {
    this.sizeBytes = sizeBytes;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }
}
