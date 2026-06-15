package com.guojiaolin.website.content;

import com.guojiaolin.website.common.ListResponse;
import com.guojiaolin.website.content.dto.BlogPostRequest;
import com.guojiaolin.website.content.dto.BlogPostResponse;
import com.guojiaolin.website.content.dto.CommentResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BlogPostController {

  private final BlogPostService blogPosts;
  private final CommentService comments;

  public BlogPostController(BlogPostService blogPosts, CommentService comments) {
    this.blogPosts = blogPosts;
    this.comments = comments;
  }

  @GetMapping("/api/blog-posts")
  public ListResponse<BlogPostResponse> listPublished() {
    return new ListResponse<>(blogPosts.listPublished());
  }

  @GetMapping("/api/blog-posts/home-featured")
  public ListResponse<BlogPostResponse> listHomeFeatured() {
    return new ListResponse<>(blogPosts.listHomeFeatured());
  }

  @GetMapping("/api/blog-posts/{slug}")
  public BlogPostResponse getPublished(@PathVariable String slug) {
    return blogPosts.getPublished(slug);
  }

  @GetMapping("/api/projects/{projectSlug}/blog-posts/{slug}")
  public BlogPostResponse getPublished(
    @PathVariable String projectSlug,
    @PathVariable String slug
  ) {
    return blogPosts.getPublished(projectSlug, slug);
  }

  @GetMapping("/api/blog-posts/{slug}/comments")
  public ListResponse<CommentResponse> comments(@PathVariable String slug) {
    return new ListResponse<>(comments.listApprovedForBlogSlug(slug));
  }

  @GetMapping("/api/projects/{projectSlug}/blog-posts/{slug}/comments")
  public ListResponse<CommentResponse> comments(
    @PathVariable String projectSlug,
    @PathVariable String slug
  ) {
    return new ListResponse<>(comments.listApprovedForBlogSlug(projectSlug, slug));
  }

  @GetMapping("/api/admin/blog-posts")
  public ListResponse<BlogPostResponse> listAdmin() {
    return new ListResponse<>(blogPosts.listAdmin());
  }

  @PostMapping("/api/admin/blog-posts")
  public ResponseEntity<BlogPostResponse> create(@Valid @RequestBody BlogPostRequest request) {
    return ResponseEntity.status(201).body(blogPosts.create(request));
  }

  @PutMapping("/api/admin/blog-posts/{id}")
  public BlogPostResponse update(@PathVariable UUID id, @Valid @RequestBody BlogPostRequest request) {
    return blogPosts.update(id, request);
  }

  @DeleteMapping("/api/admin/blog-posts/{id}")
  public ResponseEntity<Void> delete(@PathVariable UUID id) {
    blogPosts.delete(id);
    return ResponseEntity.noContent().build();
  }
}
