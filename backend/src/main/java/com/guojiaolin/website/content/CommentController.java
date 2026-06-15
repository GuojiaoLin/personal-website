package com.guojiaolin.website.content;

import com.guojiaolin.website.common.ListResponse;
import com.guojiaolin.website.content.dto.CommentRequest;
import com.guojiaolin.website.content.dto.CommentResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CommentController {

  private final CommentService comments;

  public CommentController(CommentService comments) {
    this.comments = comments;
  }

  @PostMapping("/api/comments")
  public ResponseEntity<CommentResponse> create(@Valid @RequestBody CommentRequest request, Authentication authentication) {
    return ResponseEntity.status(201).body(comments.create(request, isOwner(authentication)));
  }

  private boolean isOwner(Authentication authentication) {
    return authentication != null
      && authentication.isAuthenticated()
      && authentication.getAuthorities().stream()
        .anyMatch(authority -> "ROLE_OWNER".equals(authority.getAuthority()));
  }

  @GetMapping("/api/comments/guestbook")
  public ListResponse<CommentResponse> listGuestbook() {
    return new ListResponse<>(comments.listApprovedForGuestbook());
  }

  @GetMapping("/api/admin/comments")
  public ListResponse<CommentResponse> listAdmin() {
    return new ListResponse<>(comments.listAdmin());
  }

  @PutMapping("/api/admin/comments/{id}/approve")
  public CommentResponse approve(@PathVariable UUID id) {
    return comments.approve(id);
  }

  @PutMapping("/api/admin/comments/{id}/hide")
  public CommentResponse hide(@PathVariable UUID id) {
    return comments.hide(id);
  }

  @DeleteMapping("/api/admin/comments/{id}")
  public ResponseEntity<Void> delete(@PathVariable UUID id) {
    comments.delete(id);
    return ResponseEntity.noContent().build();
  }
}
