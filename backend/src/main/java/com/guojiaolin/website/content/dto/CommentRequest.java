package com.guojiaolin.website.content.dto;

import com.guojiaolin.website.content.CommentTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CommentRequest(
  @NotNull CommentTargetType targetType,
  UUID targetId,
  UUID parentId,
  @NotBlank @Size(max = 80) String authorName,
  @NotBlank @Size(max = 2000) String content
) {
}
