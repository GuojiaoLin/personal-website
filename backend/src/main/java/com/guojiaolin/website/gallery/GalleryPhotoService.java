package com.guojiaolin.website.gallery;

import com.guojiaolin.website.common.BadRequestException;
import com.guojiaolin.website.common.NotFoundException;
import com.guojiaolin.website.content.ContentStatus;
import com.guojiaolin.website.gallery.dto.GalleryPhotoRequest;
import com.guojiaolin.website.gallery.dto.GalleryPhotoResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

@Service
public class GalleryPhotoService {

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
  private static final Sort GALLERY_SORT = Sort.by("sortOrder").ascending().and(Sort.by("updatedAt").descending());

  private final GalleryPhotoRepository galleryPhotos;
  private final Path galleryDirectory;
  private final String publicPath;

  public GalleryPhotoService(
    GalleryPhotoRepository galleryPhotos,
    @Value("${site.uploads.directory:uploads}") String uploadDirectory,
    @Value("${site.uploads.public-path:/uploads}") String publicPath
  ) {
    this.galleryPhotos = galleryPhotos;
    this.galleryDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize().resolve("gallery").normalize();
    this.publicPath = normalizePublicPath(publicPath);
  }

  @Transactional(readOnly = true)
  public List<GalleryPhotoResponse> listPublished() {
    return galleryPhotos.findAllByStatus(ContentStatus.PUBLISHED, GALLERY_SORT).stream()
      .map(GalleryPhotoResponse::from)
      .toList();
  }

  @Transactional(readOnly = true)
  public List<GalleryPhotoResponse> listAdmin() {
    return galleryPhotos.findAll(GALLERY_SORT).stream()
      .map(GalleryPhotoResponse::from)
      .toList();
  }

  @Transactional
  public GalleryPhotoResponse upload(MultipartFile file, GalleryPhotoRequest request) {
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
      Files.createDirectories(galleryDirectory);
      var fileName = resolveAvailableFileName(file.getOriginalFilename(), mimeType);
      var destination = galleryDirectory.resolve(fileName).normalize();

      if (!destination.startsWith(galleryDirectory)) {
        throw new BadRequestException("Invalid image file name.");
      }

      try (var input = file.getInputStream()) {
        Files.copy(input, destination);
      }

      var photo = new GalleryPhoto();
      photo.setFileName(fileName);
      photo.setMimeType(mimeType);
      photo.setSizeBytes(file.getSize());
      photo.setUrl(toPublicUrl(fileName));
      apply(photo, request);

      return GalleryPhotoResponse.from(galleryPhotos.save(photo));
    } catch (IOException error) {
      throw new BadRequestException("Image upload failed.");
    }
  }

  @Transactional
  public GalleryPhotoResponse update(UUID id, GalleryPhotoRequest request) {
    var photo = galleryPhotos.findById(id)
      .orElseThrow(() -> new NotFoundException("Gallery photo not found."));

    apply(photo, request);
    return GalleryPhotoResponse.from(photo);
  }

  @Transactional
  public void delete(UUID id) {
    var photo = galleryPhotos.findById(id)
      .orElseThrow(() -> new NotFoundException("Gallery photo not found."));

    deleteFile(photo.getFileName());
    galleryPhotos.delete(photo);
  }

  private void apply(GalleryPhoto photo, GalleryPhotoRequest request) {
    var title = clean(request.title());
    if (!StringUtils.hasText(title)) {
      throw new BadRequestException("Gallery photo title is required.");
    }

    photo.setTitle(title);
    photo.setDescription(clean(request.description()));
    photo.setLocation(clean(request.location()));
    photo.setTakenAt(clean(request.takenAt()));
    photo.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
    photo.setStatus(request.status() == null ? ContentStatus.DRAFT : request.status());
  }

  private void deleteFile(String fileName) {
    var target = galleryDirectory.resolve(fileName).normalize();

    if (!target.startsWith(galleryDirectory)) {
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

    while (Files.exists(galleryDirectory.resolve(candidate))) {
      candidate = "%s-%d%s".formatted(baseName, counter, extension);
      counter += 1;
    }

    return candidate;
  }

  private String sanitizeFileName(String originalFileName) {
    var cleaned = StringUtils.cleanPath(StringUtils.hasText(originalFileName) ? originalFileName : "gallery-photo");

    if (cleaned.contains("..")) {
      throw new BadRequestException("Invalid image file name.");
    }

    var fileName = Path.of(cleaned.replace('\\', '/')).getFileName().toString().trim();
    if (!StringUtils.hasText(fileName)) {
      fileName = "gallery-photo";
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
    return "%s/gallery/%s".formatted(publicPath, UriUtils.encodePathSegment(fileName, StandardCharsets.UTF_8));
  }

  private String normalizePublicPath(String value) {
    var normalized = StringUtils.hasText(value) ? value.trim() : "/uploads";
    normalized = normalized.startsWith("/") ? normalized : "/" + normalized;
    return normalized.replaceAll("/+$", "");
  }

  private String clean(String value) {
    return value == null ? "" : value.trim();
  }
}
