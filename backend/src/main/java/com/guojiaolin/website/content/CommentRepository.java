package com.guojiaolin.website.content;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

  List<Comment> findAllByTargetTypeAndTargetIdAndStatusOrderByCreatedAtDesc(
    CommentTargetType targetType,
    UUID targetId,
    CommentStatus status
  );

  List<Comment> findAllByTargetTypeAndStatusOrderByCreatedAtDesc(
    CommentTargetType targetType,
    CommentStatus status
  );
}
