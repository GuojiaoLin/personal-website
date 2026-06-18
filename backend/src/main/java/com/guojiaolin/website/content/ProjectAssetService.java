package com.guojiaolin.website.content;

import com.guojiaolin.website.common.BadRequestException;
import com.guojiaolin.website.content.dto.ProjectAssetResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

@Service
public class ProjectAssetService {

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

  private final Path projectDirectory;
  private final String publicPath;
  private final ProjectLogoImageService projectLogoImages;

  public ProjectAssetService(
    ProjectLogoImageService projectLogoImages,
    @Value("${site.uploads.directory:uploads}") String uploadDirectory,
    @Value("${site.uploads.public-path:/uploads}") String publicPath
  ) {
    this.projectDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize().resolve("projects").normalize();
    this.publicPath = normalizePublicPath(publicPath);
    this.projectLogoImages = projectLogoImages;
  }

  public ProjectAssetResponse upload(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("Please choose an image file.");
    }

    if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException("Image must be 10MB or smaller.");
    }

    var mimeType = StringUtils.hasText(file.getContentType()) ? file.getContentType() : "application/octet-stream";
    if (!ALLOWED_IMAGE_TYPES.contains(mimeType)) {
      throw new BadRequestException("Only PNG, JPG, GIF, and WebP images are supported.");
    }

    try {
      Files.createDirectories(projectDirectory);
      var fileName = resolveAvailableFileName(file.getOriginalFilename(), mimeType);
      var destination = projectDirectory.resolve(fileName).normalize();

      if (!destination.startsWith(projectDirectory)) {
        throw new BadRequestException("Invalid image file name.");
      }

      try (var input = file.getInputStream()) {
        Files.copy(input, destination);
      }

      var optimized = projectLogoImages.process(destination, projectDirectory, fileName, mimeType);
      return new ProjectAssetResponse(
        toPublicUrl(optimized.fileName()),
        optimized.fileName(),
        optimized.mimeType(),
        optimized.sizeBytes()
      );
    } catch (IOException error) {
      throw new BadRequestException("Image upload failed.");
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

    while (Files.exists(projectDirectory.resolve(candidate))) {
      candidate = "%s-%d%s".formatted(baseName, counter, extension);
      counter += 1;
    }

    return candidate;
  }

  private String sanitizeFileName(String originalFileName) {
    var cleaned = StringUtils.cleanPath(StringUtils.hasText(originalFileName) ? originalFileName : "project-cover");

    if (cleaned.contains("..")) {
      throw new BadRequestException("Invalid image file name.");
    }

    var fileName = Path.of(cleaned.replace('\\', '/')).getFileName().toString().trim();
    if (!StringUtils.hasText(fileName)) {
      fileName = "project-cover";
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
    return "%s/projects/%s".formatted(publicPath, UriUtils.encodePathSegment(fileName, StandardCharsets.UTF_8));
  }

  private String normalizePublicPath(String value) {
    var normalized = StringUtils.hasText(value) ? value.trim() : "/uploads";
    normalized = normalized.startsWith("/") ? normalized : "/" + normalized;
    return normalized.replaceAll("/+$", "");
  }
}
