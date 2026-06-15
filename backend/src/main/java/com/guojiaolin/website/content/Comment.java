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
import java.util.UUID;

@Entity
@Table(name = "comments")
public class Comment extends AuditedEntity {

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private CommentTargetType targetType;

  private UUID targetId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_id")
  private Comment parent;

  @Column(nullable = false, length = 80)
  private String authorName;

  @Column(nullable = false, columnDefinition = "text")
  private String content;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private CommentStatus status = CommentStatus.PENDING;

  public CommentTargetType getTargetType() {
    return targetType;
  }

  public void setTargetType(CommentTargetType targetType) {
    this.targetType = targetType;
  }

  public UUID getTargetId() {
    return targetId;
  }

  public void setTargetId(UUID targetId) {
    this.targetId = targetId;
  }

  public Comment getParent() {
    return parent;
  }

  public void setParent(Comment parent) {
    this.parent = parent;
  }

  public String getAuthorName() {
    return authorName;
  }

  public void setAuthorName(String authorName) {
    this.authorName = authorName;
  }

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public CommentStatus getStatus() {
    return status;
  }

  public void setStatus(CommentStatus status) {
    this.status = status;
  }
}
