package com.guojiaolin.website.content;

import com.guojiaolin.website.common.BadRequestException;
import com.guojiaolin.website.common.NotFoundException;
import com.guojiaolin.website.content.dto.CommentRequest;
import com.guojiaolin.website.content.dto.CommentResponse;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

  private final CommentRepository comments;
  private final BlogPostService blogPostService;

  public CommentService(CommentRepository comments, BlogPostService blogPostService) {
    this.comments = comments;
    this.blogPostService = blogPostService;
  }

  @Transactional
  public CommentResponse create(CommentRequest request, boolean approveImmediately) {
    validateTarget(request.targetType(), request.targetId());

    var comment = new Comment();
    comment.setTargetType(request.targetType());
    comment.setTargetId(request.targetId());
    comment.setAuthorName(request.authorName().trim());
    comment.setContent(request.content().trim());
    comment.setStatus(approveImmediately ? CommentStatus.APPROVED : CommentStatus.PENDING);

    if (request.parentId() != null) {
      var parent = comments.findById(request.parentId())
        .orElseThrow(() -> new NotFoundException("Parent comment not found."));
      if (parent.getParent() != null) {
        throw new BadRequestException("Replies can only target top-level comments.");
      }
      if (parent.getTargetType() != request.targetType() || !Objects.equals(parent.getTargetId(), request.targetId())) {
        throw new BadRequestException("Reply target must match parent comment target.");
      }
      comment.setParent(parent);
    }

    return CommentResponse.from(comments.save(comment), List.of());
  }

  @Transactional(readOnly = true)
  public List<CommentResponse> listApprovedForBlogSlug(String slug) {
    var post = blogPostService.findPublishedBySlug(slug);
    return tree(comments.findAllByTargetTypeAndTargetIdAndStatusOrderByCreatedAtDesc(
      CommentTargetType.BLOG,
      post.getId(),
      CommentStatus.APPROVED
    ));
  }

  @Transactional(readOnly = true)
  public List<CommentResponse> listApprovedForBlogSlug(String projectSlug, String slug) {
    var post = blogPostService.findPublishedByProjectSlugAndSlug(projectSlug, slug);
    return tree(comments.findAllByTargetTypeAndTargetIdAndStatusOrderByCreatedAtDesc(
      CommentTargetType.BLOG,
      post.getId(),
      CommentStatus.APPROVED
    ));
  }

  @Transactional(readOnly = true)
  public List<CommentResponse> listApprovedForGuestbook() {
    return tree(comments.findAllByTargetTypeAndStatusOrderByCreatedAtDesc(
      CommentTargetType.GUESTBOOK,
      CommentStatus.APPROVED
    ));
  }

  @Transactional(readOnly = true)
  public List<CommentResponse> listAdmin() {
    return comments.findAll().stream()
      .sorted(Comparator.comparing(Comment::getCreatedAt).reversed())
      .map(comment -> CommentResponse.from(comment, List.of()))
      .toList();
  }

  @Transactional
  public CommentResponse approve(UUID id) {
    var comment = find(id);
    comment.setStatus(CommentStatus.APPROVED);
    return CommentResponse.from(comment, List.of());
  }

  @Transactional
  public CommentResponse hide(UUID id) {
    var comment = find(id);
    comment.setStatus(CommentStatus.HIDDEN);
    return CommentResponse.from(comment, List.of());
  }

  @Transactional
  public void delete(UUID id) {
    if (!comments.existsById(id)) {
      throw new NotFoundException("Comment not found.");
    }
    comments.deleteById(id);
  }

  private Comment find(UUID id) {
    return comments.findById(id)
      .orElseThrow(() -> new NotFoundException("Comment not found."));
  }

  private void validateTarget(CommentTargetType targetType, UUID targetId) {
    if (targetType == CommentTargetType.BLOG) {
      if (targetId == null) {
        throw new BadRequestException("Blog comments require a target id.");
      }
      blogPostService.findById(targetId);
    }

    if (targetType == CommentTargetType.GUESTBOOK && targetId != null) {
      throw new BadRequestException("Guestbook comments cannot include a target id.");
    }
  }

  private List<CommentResponse> tree(List<Comment> flat) {
    return flat.stream()
      .filter(comment -> comment.getParent() == null)
      .map(root -> CommentResponse.from(root, replies(root, flat)))
      .toList();
  }

  private List<CommentResponse> replies(Comment root, List<Comment> flat) {
    return flat.stream()
      .filter(comment -> comment.getParent() != null && comment.getParent().getId().equals(root.getId()))
      .sorted(Comparator.comparing(Comment::getCreatedAt))
      .map(reply -> CommentResponse.from(reply, List.of()))
      .toList();
  }
}
