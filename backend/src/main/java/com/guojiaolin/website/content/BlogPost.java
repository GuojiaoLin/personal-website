package com.guojiaolin.website.content;

import com.guojiaolin.website.common.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "blog_posts")
public class BlogPost extends AuditedEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private Project project;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String slug;

  @Column(nullable = false)
  private String category;

  @Column(nullable = false, length = 1000)
  private String summary;

  @Column(nullable = false, columnDefinition = "text")
  private String contentMarkdown;

  @Column(nullable = false)
  private int blogOrder = 0;

  @Column(nullable = false)
  private boolean featuredOnHome = false;

  @Column(nullable = false)
  private int homeOrder = 0;

  private String coverImageUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ContentStatus status = ContentStatus.DRAFT;

  private Instant publishedAt;

  public Project getProject() {
    return project;
  }

  public void setProject(Project project) {
    this.project = project;
  }

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

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getSummary() {
    return summary;
  }

  public void setSummary(String summary) {
    this.summary = summary;
  }

  public String getContentMarkdown() {
    return contentMarkdown;
  }

  public void setContentMarkdown(String contentMarkdown) {
    this.contentMarkdown = contentMarkdown;
  }

  public int getBlogOrder() {
    return blogOrder;
  }

  public void setBlogOrder(int blogOrder) {
    this.blogOrder = blogOrder;
  }

  public boolean isFeaturedOnHome() {
    return featuredOnHome;
  }

  public void setFeaturedOnHome(boolean featuredOnHome) {
    this.featuredOnHome = featuredOnHome;
  }

  public int getHomeOrder() {
    return homeOrder;
  }

  public void setHomeOrder(int homeOrder) {
    this.homeOrder = homeOrder;
  }

  public String getCoverImageUrl() {
    return coverImageUrl;
  }

  public void setCoverImageUrl(String coverImageUrl) {
    this.coverImageUrl = coverImageUrl;
  }

  public ContentStatus getStatus() {
    return status;
  }

  public void setStatus(ContentStatus status) {
    this.status = status;
  }

  public Instant getPublishedAt() {
    return publishedAt;
  }

  public void setPublishedAt(Instant publishedAt) {
    this.publishedAt = publishedAt;
  }
}
