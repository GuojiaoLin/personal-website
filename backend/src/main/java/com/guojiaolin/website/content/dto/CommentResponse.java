package com.guojiaolin.website.content.dto;

import com.guojiaolin.website.content.Comment;
import com.guojiaolin.website.content.CommentStatus;
import com.guojiaolin.website.content.CommentTargetType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CommentResponse(
  UUID id,
  CommentTargetType targetType,
  UUID targetId,
  UUID parentId,
  String authorName,
  String content,
  CommentStatus status,
  Instant createdAt,
  List<CommentResponse> replies
) {

  public static CommentResponse from(Comment comment, List<CommentResponse> replies) {
    var parent = comment.getParent();
    return new CommentResponse(
      comment.getId(),
      comment.getTargetType(),
      comment.getTargetId(),
      parent == null ? null : parent.getId(),
      comment.getAuthorName(),
      comment.getContent(),
      comment.getStatus(),
      comment.getCreatedAt(),
      replies
    );
  }
}
