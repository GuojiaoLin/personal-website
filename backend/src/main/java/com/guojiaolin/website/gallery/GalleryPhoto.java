package com.guojiaolin.website.gallery;

import com.guojiaolin.website.common.AuditedEntity;
import com.guojiaolin.website.content.ContentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "gallery_photos")
public class GalleryPhoto extends AuditedEntity {

  @Column(nullable = false)
  private String title;

  @Column(nullable = false, columnDefinition = "text")
  private String description = "";

  @Column(nullable = false)
  private String location = "";

  @Column(nullable = false)
  private String takenAt = "";

  @Column(nullable = false)
  private int sortOrder = 0;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ContentStatus status = ContentStatus.DRAFT;

  @Column(nullable = false)
  private String url;

  @Column(nullable = false)
  private String thumbnailUrl = "";

  @Column(nullable = false)
  private String mediumUrl = "";

  @Column(nullable = false)
  private String fileName;

  @Column(nullable = false)
  private String mimeType;

  @Column(nullable = false)
  private long sizeBytes;

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public String getTakenAt() {
    return takenAt;
  }

  public void setTakenAt(String takenAt) {
    this.takenAt = takenAt;
  }

  public int getSortOrder() {
    return sortOrder;
  }

  public void setSortOrder(int sortOrder) {
    this.sortOrder = sortOrder;
  }

  public ContentStatus getStatus() {
    return status;
  }

  public void setStatus(ContentStatus status) {
    this.status = status;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getThumbnailUrl() {
    return thumbnailUrl;
  }

  public void setThumbnailUrl(String thumbnailUrl) {
    this.thumbnailUrl = thumbnailUrl;
  }

  public String getMediumUrl() {
    return mediumUrl;
  }

  public void setMediumUrl(String mediumUrl) {
    this.mediumUrl = mediumUrl;
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
}
