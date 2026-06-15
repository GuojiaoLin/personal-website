package com.guojiaolin.website.content;

import com.guojiaolin.website.common.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "projects")
public class Project extends AuditedEntity {

  @Column(nullable = false)
  private String title;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(nullable = false, length = 1000)
  private String summary;

  @Column(nullable = false, columnDefinition = "text")
  private String descriptionMarkdown = "";

  private String coverImageUrl;

  private String projectIcon;

  @Column(nullable = false, length = 4000)
  private String techStack = "[]";

  @Column(nullable = false)
  private int sortOrder = 0;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ContentStatus status = ContentStatus.DRAFT;

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug;
  }

  public String getSummary() {
    return summary;
  }

  public void setSummary(String summary) {
    this.summary = summary;
  }

  public String getDescriptionMarkdown() {
    return descriptionMarkdown;
  }

  public void setDescriptionMarkdown(String descriptionMarkdown) {
    this.descriptionMarkdown = descriptionMarkdown;
  }

  public String getCoverImageUrl() {
    return coverImageUrl;
  }

  public void setCoverImageUrl(String coverImageUrl) {
    this.coverImageUrl = coverImageUrl;
  }

  public String getProjectIcon() {
    return projectIcon;
  }

  public void setProjectIcon(String projectIcon) {
    this.projectIcon = projectIcon;
  }

  public String getTechStack() {
    return techStack;
  }

  public void setTechStack(String techStack) {
    this.techStack = techStack;
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
}
