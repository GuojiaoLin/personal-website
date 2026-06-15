package com.guojiaolin.website.home;

import com.guojiaolin.website.common.BadRequestException;
import com.guojiaolin.website.common.NotFoundException;
import com.guojiaolin.website.content.ContentStatus;
import com.guojiaolin.website.gallery.GalleryPhoto;
import com.guojiaolin.website.gallery.GalleryPhotoRepository;
import com.guojiaolin.website.home.dto.HomeGallerySlotItemRequest;
import com.guojiaolin.website.home.dto.HomeGallerySlotRequest;
import com.guojiaolin.website.home.dto.HomeGallerySlotResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

@Service
public class HomeGallerySlotService {

  public static final List<String> SLOT_KEYS = List.of(
    "hero-polaroid",
    "resume-card",
    "life-card",
    "about-portrait"
  );

  private static final Set<String> SLOT_KEY_SET = new LinkedHashSet<>(SLOT_KEYS);
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
  private static final Map<String, String> SLOT_TITLES = Map.of(
    "hero-polaroid", "首页顶部左侧拍立得",
    "resume-card", "履历卡片图片",
    "life-card", "生活与快门图片",
    "about-portrait", "关于我大图"
  );

  private final HomeGallerySlotRepository homeGallerySlots;
  private final GalleryPhotoRepository galleryPhotos;
  private final Path homeImageDirectory;
  private final String publicPath;

  public HomeGallerySlotService(
    HomeGallerySlotRepository homeGallerySlots,
    GalleryPhotoRepository galleryPhotos,
    @Value("${site.uploads.directory:uploads}") String uploadDirectory,
    @Value("${site.uploads.public-path:/uploads}") String publicPath
  ) {
    this.homeGallerySlots = homeGallerySlots;
    this.galleryPhotos = galleryPhotos;
    this.homeImageDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize().resolve("home").normalize();
    this.publicPath = normalizePublicPath(publicPath);
  }

  @Transactional(readOnly = true)
  public List<HomeGallerySlotResponse> listPublic() {
    var slots = slotMap();

    return SLOT_KEYS.stream()
      .map((slotKey) -> {
        var slot = slots.get(slotKey);
        var photo = selectedPhoto(slot);
        if (photo != null && photo.getStatus() != ContentStatus.PUBLISHED) {
          photo = null;
        }
        return HomeGallerySlotResponse.of(slotKey, slot, photo, titleForSlot(slotKey));
      })
      .toList();
  }

  @Transactional(readOnly = true)
  public List<HomeGallerySlotResponse> listAdmin() {
    var slots = slotMap();

    return SLOT_KEYS.stream()
      .map((slotKey) -> {
        var slot = slots.get(slotKey);
        return HomeGallerySlotResponse.of(slotKey, slot, selectedPhoto(slot), titleForSlot(slotKey));
      })
      .toList();
  }

  @Transactional
  public List<HomeGallerySlotResponse> update(HomeGallerySlotRequest request) {
    for (var item : request.slots() == null ? List.<HomeGallerySlotItemRequest>of() : request.slots()) {
      var slotKey = cleanSlotKey(item.slotKey());
      var slot = homeGallerySlots.findBySlotKey(slotKey).orElseGet(() -> {
        var created = new HomeGallerySlot();
        created.setSlotKey(slotKey);
        return created;
      });

      deleteUploadedFile(slot);
      clearUploadedImage(slot);
      slot.setGalleryPhoto(resolvePhoto(item));
      homeGallerySlots.save(slot);
    }

    return listAdmin();
  }

  @Transactional
  public HomeGallerySlotResponse uploadImage(String rawSlotKey, MultipartFile file) {
    var slotKey = cleanSlotKey(rawSlotKey);
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
      Files.createDirectories(homeImageDirectory);
      var fileName = resolveAvailableFileName(file.getOriginalFilename(), mimeType);
      var destination = homeImageDirectory.resolve(fileName).normalize();
      if (!destination.startsWith(homeImageDirectory)) {
        throw new BadRequestException("Invalid image file name.");
      }

      try (var input = file.getInputStream()) {
        Files.copy(input, destination);
      }

      var slot = homeGallerySlots.findBySlotKey(slotKey).orElseGet(() -> {
        var created = new HomeGallerySlot();
        created.setSlotKey(slotKey);
        return created;
      });

      deleteUploadedFile(slot);
      slot.setGalleryPhoto(null);
      slot.setUploadedFileName(fileName);
      slot.setUploadedMimeType(mimeType);
      slot.setUploadedSizeBytes(file.getSize());
      slot.setUploadedImageUrl(toPublicUrl(fileName));
      var saved = homeGallerySlots.save(slot);

      return HomeGallerySlotResponse.of(slotKey, saved, null, titleForSlot(slotKey));
    } catch (IOException error) {
      throw new BadRequestException("Image upload failed.");
    }
  }

  private Map<String, HomeGallerySlot> slotMap() {
    return homeGallerySlots.findAllBySlotKeyIn(SLOT_KEYS).stream()
      .collect(Collectors.toMap(HomeGallerySlot::getSlotKey, Function.identity()));
  }

  private GalleryPhoto selectedPhoto(HomeGallerySlot slot) {
    return slot == null ? null : slot.getGalleryPhoto();
  }

  private GalleryPhoto resolvePhoto(HomeGallerySlotItemRequest item) {
    if (item.galleryPhotoId() == null) return null;

    return galleryPhotos.findById(item.galleryPhotoId())
      .orElseThrow(() -> new NotFoundException("Gallery photo not found."));
  }

  private String cleanSlotKey(String value) {
    var slotKey = StringUtils.hasText(value) ? value.trim() : "";
    if (!SLOT_KEY_SET.contains(slotKey)) {
      throw new BadRequestException("Unknown home gallery slot.");
    }

    return slotKey;
  }

  private String titleForSlot(String slotKey) {
    return SLOT_TITLES.getOrDefault(slotKey, "首页图片");
  }

  private void clearUploadedImage(HomeGallerySlot slot) {
    slot.setUploadedImageUrl(null);
    slot.setUploadedFileName(null);
    slot.setUploadedMimeType(null);
    slot.setUploadedSizeBytes(null);
  }

  private void deleteUploadedFile(HomeGallerySlot slot) {
    if (slot == null || !StringUtils.hasText(slot.getUploadedFileName())) {
      return;
    }

    var target = homeImageDirectory.resolve(slot.getUploadedFileName()).normalize();
    if (!target.startsWith(homeImageDirectory)) {
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
      extension = MIME_EXTENSIONS.getOrDefault(mimeType, "");
    }

    var baseName = sanitized;
    if (StringUtils.hasText(extension) && !baseName.toLowerCase(Locale.ROOT).endsWith(extension)) {
      baseName = baseName + extension;
    }

    var candidate = baseName;
    var dotIndex = candidate.lastIndexOf('.');
    var prefix = dotIndex > 0 ? candidate.substring(0, dotIndex) : candidate;
    var suffix = dotIndex > 0 ? candidate.substring(dotIndex) : "";
    var counter = 2;

    while (Files.exists(homeImageDirectory.resolve(candidate))) {
      candidate = "%s-%d%s".formatted(prefix, counter, suffix);
      counter += 1;
    }

    return candidate;
  }

  private String sanitizeFileName(String originalFileName) {
    var fallback = "home-image";
    var fileName = StringUtils.hasText(originalFileName) ? Path.of(originalFileName).getFileName().toString() : fallback;
    fileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "-");
    fileName = fileName.replaceAll("-+", "-");
    return StringUtils.hasText(fileName) ? fileName : fallback;
  }

  private String extensionOf(String fileName) {
    var dotIndex = fileName.lastIndexOf('.');
    return dotIndex > 0 ? fileName.substring(dotIndex).toLowerCase(Locale.ROOT) : "";
  }

  private String toPublicUrl(String fileName) {
    return "%s/home/%s".formatted(publicPath, UriUtils.encodePathSegment(fileName, StandardCharsets.UTF_8));
  }

  private String normalizePublicPath(String value) {
    var normalized = StringUtils.hasText(value) ? value.trim() : "/uploads";
    normalized = normalized.startsWith("/") ? normalized : "/" + normalized;
    return normalized.replaceAll("/+$", "");
  }
}
