package com.guojiaolin.website.media;

import com.guojiaolin.website.content.BlogPost;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "media_assets")
public class MediaAsset {

  @Id
  @GeneratedValue
  private UUID id;

  @Column(nullable = false)
  private String url;

  @Column(nullable = false)
  private String fileName;

  @Column(nullable = false)
  private String mimeType;

  @Column(nullable = false)
  private long sizeBytes;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "blog_post_id")
  private BlogPost blogPost;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void prePersist() {
    createdAt = Instant.now();
  }

  public UUID getId() {
    return id;
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

  public BlogPost getBlogPost() {
    return blogPost;
  }

  public void setBlogPost(BlogPost blogPost) {
    this.blogPost = blogPost;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
