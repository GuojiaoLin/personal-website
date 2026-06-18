package com.guojiaolin.website.media;

import com.guojiaolin.website.common.BadRequestException;
import com.guojiaolin.website.common.ImageUploadOptimizationService;
import com.guojiaolin.website.common.NotFoundException;
import com.guojiaolin.website.content.BlogPostRepository;
import com.guojiaolin.website.media.dto.MediaAssetResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

@Service
public class MediaAssetService {

  private static final long MAX_IMAGE_SIZE_BYTES = 10L * 1024L * 1024L;
  private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp"
  );
  private static final Map<String, String> MIME_EXTENSIONS = Map.of(
    "image/png", ".png",
    "image/jpeg", ".jpg",
    "image/gif", ".gif",
    "image/webp", ".webp"
  );
  private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(".png", ".jpg", ".jpeg", ".gif", ".webp");

  private final MediaAssetRepository mediaAssets;
  private final BlogPostRepository blogPosts;
  private final Path uploadDirectory;
  private final String publicPath;
  private final ImageUploadOptimizationService imageOptimizer;

  public MediaAssetService(
    MediaAssetRepository mediaAssets,
    BlogPostRepository blogPosts,
    ImageUploadOptimizationService imageOptimizer,
    @Value("${site.uploads.directory:uploads}") String uploadDirectory,
    @Value("${site.uploads.public-path:/uploads}") String publicPath
  ) {
    this.mediaAssets = mediaAssets;
    this.blogPosts = blogPosts;
    this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    this.publicPath = normalizePublicPath(publicPath);
    this.imageOptimizer = imageOptimizer;
  }

  @Transactional(readOnly = true)
  public List<MediaAssetResponse> list(UUID blogPostId) {
    var sort = Sort.by("createdAt").descending();

    return (blogPostId == null ? mediaAssets.findAll(sort) : mediaAssets.findAllByBlogPost_Id(blogPostId, sort)).stream()
      .map(MediaAssetResponse::from)
      .toList();
  }

  @Transactional
  public MediaAssetResponse upload(MultipartFile file, UUID blogPostId) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("Please choose an image file.");
    }

    if (blogPostId == null) {
      throw new BadRequestException("Please save the blog draft before uploading images.");
    }

    var blogPost = blogPosts.findById(blogPostId)
      .orElseThrow(() -> new NotFoundException("Blog post not found."));

    if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException("Image must be 10MB or smaller.");
    }

    var mimeType = StringUtils.hasText(file.getContentType()) ? file.getContentType() : "application/octet-stream";
    if (!ALLOWED_IMAGE_TYPES.contains(mimeType)) {
      throw new BadRequestException("Only PNG, JPG, GIF, and WebP images are supported.");
    }

    try {
      Files.createDirectories(uploadDirectory);
      var fileName = resolveAvailableFileName(file.getOriginalFilename(), mimeType);
      var destination = uploadDirectory.resolve(fileName).normalize();

      if (!destination.startsWith(uploadDirectory)) {
        throw new BadRequestException("Invalid image file name.");
      }

      try (var input = file.getInputStream()) {
        Files.copy(input, destination);
      }

      var optimized = imageOptimizer.optimize(destination, uploadDirectory, fileName, mimeType);
      var asset = new MediaAsset();
      asset.setFileName(optimized.fileName());
      asset.setMimeType(optimized.mimeType());
      asset.setSizeBytes(optimized.sizeBytes());
      asset.setUrl(toPublicUrl(optimized.fileName()));
      asset.setBlogPost(blogPost);

      return MediaAssetResponse.from(mediaAssets.save(asset));
    } catch (IOException error) {
      throw new BadRequestException("Image upload failed.");
    }
  }

  @Transactional
  public void delete(UUID id) {
    var asset = mediaAssets.findById(id)
      .orElseThrow(() -> new NotFoundException("Media asset not found."));

    deleteFile(asset.getFileName());
    mediaAssets.delete(asset);
  }

  private void deleteFile(String fileName) {
    var target = uploadDirectory.resolve(fileName).normalize();

    if (!target.startsWith(uploadDirectory)) {
      throw new BadRequestException("Invalid image file name.");
    }

    try {
      Files.deleteIfExists(target);
    } catch (IOException error) {
      throw new BadRequestException("Image delete failed.");
    }
  }

  private String resolveAvailableFileName(String originalFileName, String mimeType) throws IOException {
    var sanitized = sanitizeFileName(originalFileName);
    var extension = extensionOf(sanitized);

    if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
      var baseName = StringUtils.hasText(extension)
        ? sanitized.substring(0, sanitized.length() - extension.length())
        : sanitized;

      sanitized = baseName + MIME_EXTENSIONS.getOrDefault(mimeType, "");
      extension = extensionOf(sanitized);
    }

    var baseName = sanitized.substring(0, sanitized.length() - extension.length());
    var candidate = sanitized;
    var counter = 2;

    while (Files.exists(uploadDirectory.resolve(candidate))) {
      candidate = "%s-%d%s".formatted(baseName, counter, extension);
      counter += 1;
    }

    return candidate;
  }

  private String sanitizeFileName(String originalFileName) {
    var cleaned = StringUtils.cleanPath(StringUtils.hasText(originalFileName) ? originalFileName : "image");

    if (cleaned.contains("..")) {
      throw new BadRequestException("Invalid image file name.");
    }

    var fileName = Path.of(cleaned.replace('\\', '/')).getFileName().toString().trim();
    if (!StringUtils.hasText(fileName)) {
      fileName = "image";
    }

    return fileName
      .replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}._ -]", "-")
      .replaceAll("-{2,}", "-");
  }

  private String extensionOf(String fileName) {
    var dotIndex = fileName.lastIndexOf('.');
    return dotIndex > 0 ? fileName.substring(dotIndex).toLowerCase() : "";
  }

  private String toPublicUrl(String fileName) {
    return "%s/%s".formatted(publicPath, UriUtils.encodePathSegment(fileName, StandardCharsets.UTF_8));
  }

  private String normalizePublicPath(String value) {
    var normalized = StringUtils.hasText(value) ? value.trim() : "/uploads";
    normalized = normalized.startsWith("/") ? normalized : "/" + normalized;
    return normalized.replaceAll("/+$", "");
  }
}
