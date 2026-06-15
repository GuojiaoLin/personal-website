package com.guojiaolin.website.resume;

import com.guojiaolin.website.common.BadRequestException;
import com.guojiaolin.website.common.NotFoundException;
import com.guojiaolin.website.resume.dto.ResumeVersionResponse;
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
public class ResumeVersionService {

  private static final long MAX_RESUME_SIZE_BYTES = 10L * 1024L * 1024L;
  private static final Set<String> ALLOWED_RESUME_TYPES = Set.of(
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  private static final Map<String, String> MIME_EXTENSIONS = Map.of(
    "application/pdf", ".pdf",
    "application/msword", ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"
  );
  private static final Set<String> ALLOWED_RESUME_EXTENSIONS = Set.of(".pdf", ".doc", ".docx");

  private final ResumeVersionRepository resumeVersions;
  private final Path resumeDirectory;
  private final String publicPath;

  public ResumeVersionService(
    ResumeVersionRepository resumeVersions,
    @Value("${site.uploads.directory:uploads}") String uploadDirectory,
    @Value("${site.uploads.public-path:/uploads}") String publicPath
  ) {
    this.resumeVersions = resumeVersions;
    this.resumeDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize().resolve("resumes");
    this.publicPath = normalizePublicPath(publicPath);
  }

  @Transactional(readOnly = true)
  public List<ResumeVersionResponse> listAdmin() {
    var sort = Sort.by(Sort.Order.desc("active"), Sort.Order.desc("updatedAt"));
    return resumeVersions.findAll(sort).stream()
      .map(ResumeVersionResponse::from)
      .toList();
  }

  @Transactional(readOnly = true)
  public ResumeVersionResponse getActive() {
    return ResumeVersionResponse.from(resumeVersions.findFirstByActiveTrueOrderByUpdatedAtDesc()
      .orElseThrow(() -> new NotFoundException("Resume version not found.")));
  }

  @Transactional
  public ResumeVersionResponse upload(MultipartFile file, String label) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("Please choose a resume file.");
    }

    if (label == null || label.isBlank()) {
      throw new BadRequestException("Resume version label is required.");
    }

    if (file.getSize() > MAX_RESUME_SIZE_BYTES) {
      throw new BadRequestException("Resume file must be 10MB or smaller.");
    }

    var mimeType = StringUtils.hasText(file.getContentType()) ? file.getContentType() : "application/octet-stream";
    if (!ALLOWED_RESUME_TYPES.contains(mimeType)) {
      throw new BadRequestException("Only PDF, DOC, and DOCX resume files are supported.");
    }

    try {
      Files.createDirectories(resumeDirectory);
      var fileName = resolveAvailableFileName(file.getOriginalFilename(), mimeType);
      var destination = resumeDirectory.resolve(fileName).normalize();

      if (!destination.startsWith(resumeDirectory)) {
        throw new BadRequestException("Invalid resume file name.");
      }

      try (var input = file.getInputStream()) {
        Files.copy(input, destination);
      }

      var version = new ResumeVersion();
      version.setLabel(label.trim());
      version.setFileName(fileName);
      version.setMimeType(mimeType);
      version.setSizeBytes(file.getSize());
      version.setUrl(toPublicUrl(fileName));
      version.setActive(resumeVersions.count() == 0);

      return ResumeVersionResponse.from(resumeVersions.save(version));
    } catch (IOException error) {
      throw new BadRequestException("Resume upload failed.");
    }
  }

  @Transactional
  public ResumeVersionResponse activate(UUID id) {
    var target = resumeVersions.findById(id)
      .orElseThrow(() -> new NotFoundException("Resume version not found."));

    if (target.isActive()) {
      return ResumeVersionResponse.from(target);
    }

    resumeVersions.deactivateAll();
    target.setActive(true);

    return ResumeVersionResponse.from(target);
  }

  @Transactional
  public void delete(UUID id) {
    var version = resumeVersions.findById(id)
      .orElseThrow(() -> new NotFoundException("Resume version not found."));

    deleteFile(version.getFileName());
    resumeVersions.delete(version);
  }

  private void deleteFile(String fileName) {
    var target = resumeDirectory.resolve(fileName).normalize();

    if (!target.startsWith(resumeDirectory)) {
      throw new BadRequestException("Invalid resume file name.");
    }

    try {
      Files.deleteIfExists(target);
    } catch (IOException error) {
      throw new BadRequestException("Resume delete failed.");
    }
  }

  private String resolveAvailableFileName(String originalFileName, String mimeType) throws IOException {
    var sanitized = sanitizeFileName(originalFileName);
    var extension = extensionOf(sanitized);

    if (!ALLOWED_RESUME_EXTENSIONS.contains(extension)) {
      var baseName = StringUtils.hasText(extension)
        ? sanitized.substring(0, sanitized.length() - extension.length())
        : sanitized;

      sanitized = baseName + MIME_EXTENSIONS.getOrDefault(mimeType, "");
      extension = extensionOf(sanitized);
    }

    var baseName = sanitized.substring(0, sanitized.length() - extension.length());
    var candidate = sanitized;
    var counter = 2;

    while (Files.exists(resumeDirectory.resolve(candidate))) {
      candidate = "%s-%d%s".formatted(baseName, counter, extension);
      counter += 1;
    }

    return candidate;
  }

  private String sanitizeFileName(String originalFileName) {
    var cleaned = StringUtils.cleanPath(StringUtils.hasText(originalFileName) ? originalFileName : "resume");

    if (cleaned.contains("..")) {
      throw new BadRequestException("Invalid resume file name.");
    }

    var fileName = Path.of(cleaned.replace('\\', '/')).getFileName().toString().trim();
    if (!StringUtils.hasText(fileName)) {
      fileName = "resume";
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
    return "%s/resumes/%s".formatted(publicPath, UriUtils.encodePathSegment(fileName, StandardCharsets.UTF_8));
  }

  private String normalizePublicPath(String value) {
    var normalized = StringUtils.hasText(value) ? value.trim() : "/uploads";
    normalized = normalized.startsWith("/") ? normalized : "/" + normalized;
    return normalized.replaceAll("/+$", "");
  }
}
