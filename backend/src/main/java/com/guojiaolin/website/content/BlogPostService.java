package com.guojiaolin.website.content;

import com.guojiaolin.website.common.BadRequestException;
import com.guojiaolin.website.common.NotFoundException;
import com.guojiaolin.website.content.dto.BlogPostRequest;
import com.guojiaolin.website.content.dto.BlogPostResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BlogPostService {

  private static final Sort BLOG_SORT = Sort.by("blogOrder").ascending().and(Sort.by("publishedAt").descending());
  private static final Sort HOME_FEATURED_SORT = Sort.by("homeOrder").ascending()
    .and(Sort.by("publishedAt").descending());
  private static final int HOME_FEATURED_LIMIT = 3;

  private final BlogPostRepository blogPosts;
  private final ProjectService projectService;

  public BlogPostService(BlogPostRepository blogPosts, ProjectService projectService) {
    this.blogPosts = blogPosts;
    this.projectService = projectService;
  }

  @Transactional(readOnly = true)
  public List<BlogPostResponse> listPublished() {
    return blogPosts.findAllByStatus(ContentStatus.PUBLISHED, BLOG_SORT).stream()
      .map(BlogPostResponse::from)
      .toList();
  }

  @Transactional(readOnly = true)
  public List<BlogPostResponse> listHomeFeatured() {
    return blogPosts.findAllByStatusAndFeaturedOnHome(ContentStatus.PUBLISHED, true, HOME_FEATURED_SORT).stream()
      .limit(HOME_FEATURED_LIMIT)
      .map(BlogPostResponse::from)
      .toList();
  }

  @Transactional(readOnly = true)
  public BlogPostResponse getPublished(String slug) {
    return BlogPostResponse.from(findPublishedBySlug(slug));
  }

  @Transactional(readOnly = true)
  public BlogPostResponse getPublished(String projectSlug, String slug) {
    return BlogPostResponse.from(findPublishedByProjectSlugAndSlug(projectSlug, slug));
  }

  @Transactional(readOnly = true)
  public List<BlogPostResponse> listAdmin() {
    return blogPosts.findAll(BLOG_SORT).stream()
      .map(BlogPostResponse::from)
      .toList();
  }

  @Transactional
  public BlogPostResponse create(BlogPostRequest request) {
    var project = projectService.findById(request.projectId());

    if (blogPosts.existsByProject_IdAndSlugIgnoreCase(project.getId(), request.slug())) {
      throw new BadRequestException("Blog post slug already exists.");
    }

    var post = new BlogPost();
    apply(post, request, project);
    return BlogPostResponse.from(blogPosts.save(post));
  }

  @Transactional
  public BlogPostResponse update(UUID id, BlogPostRequest request) {
    var post = blogPosts.findById(id)
      .orElseThrow(() -> new NotFoundException("Blog post not found."));

    var project = projectService.findById(request.projectId());

    blogPosts.findByProject_IdAndSlugIgnoreCase(project.getId(), request.slug())
      .filter(existing -> !existing.getId().equals(id))
      .ifPresent(existing -> {
        throw new BadRequestException("Blog post slug already exists.");
      });

    apply(post, request, project);
    return BlogPostResponse.from(post);
  }

  @Transactional
  public void delete(UUID id) {
    if (!blogPosts.existsById(id)) {
      throw new NotFoundException("Blog post not found.");
    }
    blogPosts.deleteById(id);
  }

  @Transactional(readOnly = true)
  public BlogPost findById(UUID id) {
    return blogPosts.findById(id)
      .orElseThrow(() -> new NotFoundException("Blog post not found."));
  }

  @Transactional(readOnly = true)
  public BlogPost findPublishedBySlug(String slug) {
    return blogPosts.findBySlugIgnoreCaseAndStatus(slug, ContentStatus.PUBLISHED)
      .orElseThrow(() -> new NotFoundException("Blog post not found."));
  }

  @Transactional(readOnly = true)
  public BlogPost findPublishedByProjectSlugAndSlug(String projectSlug, String slug) {
    return blogPosts.findByProject_SlugIgnoreCaseAndSlugIgnoreCaseAndStatus(projectSlug, slug, ContentStatus.PUBLISHED)
      .orElseThrow(() -> new NotFoundException("Blog post not found."));
  }

  private void apply(BlogPost post, BlogPostRequest request, Project project) {
    post.setProject(project);
    post.setTitle(request.title().trim());
    post.setSlug(request.slug().trim().toLowerCase());
    post.setCategory(request.category().trim());
    post.setSummary(request.summary().trim());
    post.setContentMarkdown(request.contentMarkdown().trim());
    post.setBlogOrder(request.blogOrder() == null ? 0 : request.blogOrder());
    post.setFeaturedOnHome(Boolean.TRUE.equals(request.featuredOnHome()));
    post.setHomeOrder(request.homeOrder() == null ? 0 : request.homeOrder());
    post.setCoverImageUrl(blankToNull(request.coverImageUrl()));
    post.setStatus(request.status() == null ? ContentStatus.DRAFT : request.status());

    if (post.getStatus() == ContentStatus.PUBLISHED && post.getPublishedAt() == null) {
      post.setPublishedAt(Instant.now());
    }
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }
}
