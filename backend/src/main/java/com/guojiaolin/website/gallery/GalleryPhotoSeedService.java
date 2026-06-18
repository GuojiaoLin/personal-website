package com.guojiaolin.website.gallery;

import com.guojiaolin.website.content.ContentStatus;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriUtils;

@Component
public class GalleryPhotoSeedService implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(GalleryPhotoSeedService.class);
  private static final String FRONTEND_GALLERY_PREFIX = "../../docs/images/图册/";
  private static final Set<String> SUPPORTED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".avif");
  private static final Map<String, Integer> PLACEMENTS = Map.of(
    "微信图片_20260509190303.jpg", 0,
    "微信图片_20260509190325.jpg", 7,
    "微信图片_20260509190428.jpg", 11,
    "微信图片_20260529170514.jpg", 15,
    "微信图片_20260509190432.jpg", 16,
    "微信图片_20260509190439.jpg", 21
  );
  private static final List<PhotoDetail> PHOTO_DETAILS = List.of(
    new PhotoDetail("屋檐小太阳", "仰头遇见一只小太阳，黑白色也能把春天照亮。", "2020"),
    new PhotoDetail("夜桥旧梦", "夜色温柔，衣袂轻轻，像误入一场旧梦。", "2019"),
    new PhotoDetail("泡泡橘猫", "泡泡、笑容和橘猫，都是今天最轻盈的快乐。", "2021"),
    new PhotoDetail("屋顶春饮", "在屋顶喝一口春天，风也变得很甜。", "2022"),
    new PhotoDetail("木箱晒猫", "晒太阳的小猫，连风都变得软乎乎。", "2020"),
    new PhotoDetail("雪径白帽", "雪落成诗，白帽子里藏着一点可爱。", "2023"),
    new PhotoDetail("花船远方", "花在近处，船在远方，风把日子吹成了蓝色。", "2021"),
    new PhotoDetail("雪山披肩", "雪山把蓝天借给我，风把披肩吹成一首小诗。", "2024"),
    new PhotoDetail("双猫午睡", "毛茸茸的梦靠在一起，今天的温柔有双份。", "2022"),
    new PhotoDetail("森林光里", "坐在森林的光里，连发梢都沾上了温柔。", "2024"),
    new PhotoDetail("云雾雪峰", "云雾替雪山写信，字字都是远方。", "2023"),
    new PhotoDetail("蓝披肩山风", "把山风披在身上，今天是会飞的蓝色。", "2024"),
    new PhotoDetail("粉枝春甜", "粉色花开满枝头，春天一下子变得甜甜的。", "2019"),
    new PhotoDetail("冬日举高高", "把冬天抱进怀里，也把快乐举高高。", "2021"),
    new PhotoDetail("掌心小花", "捧住一朵小小花，也捧住了阳光落下的瞬间。", "2020"),
    new PhotoDetail("圆眼小猫", "一双圆圆眼睛，把世界看得亮晶晶。", "2022"),
    new PhotoDetail("紫色花海", "紫色花海轻轻晃，像春天偷偷打翻了梦。", "2019"),
    new PhotoDetail("樱花云朵", "樱花开成云朵，抬头就撞进粉色童话。", "2023"),
    new PhotoDetail("草地光影", "阳光落在草地上，也落进了软乎乎的心情里。", "2020"),
    new PhotoDetail("橘花向阳", "橘色小花朝着天空笑，今天的快乐很明亮。", "2021"),
    new PhotoDetail("湖畔明信片", "蓝天、草地和湖水，拼成一张安静的明信片。", "2024"),
    new PhotoDetail("草帽小猫", "今日份小猫戴帽营业：可爱满分，懒洋洋加倍。", "2019"),
    new PhotoDetail("远山湖风", "湖边有风，远山不语，时间也变得慢悠悠。", "2022"),
    new PhotoDetail("花影春风", "举起小相机，记录一场绿色的梦。", "2024"),
    new PhotoDetail("生活切片 25", "树影轻轻晃，夏天也变得软软的。", "2024")
  );

  private final GalleryPhotoRepository galleryPhotos;
  private final GalleryImageDerivativeService imageDerivatives;
  private final Path uploadGalleryDirectory;
  private final String publicPath;
  private final boolean enabled;
  private final String configuredSourceDirectory;

  public GalleryPhotoSeedService(
    GalleryPhotoRepository galleryPhotos,
    GalleryImageDerivativeService imageDerivatives,
    @Value("${site.uploads.directory:uploads}") String uploadDirectory,
    @Value("${site.uploads.public-path:/uploads}") String publicPath,
    @Value("${site.gallery.seed.enabled:false}") boolean enabled,
    @Value("${site.gallery.seed.source-directory:}") String configuredSourceDirectory
  ) {
    this.galleryPhotos = galleryPhotos;
    this.imageDerivatives = imageDerivatives;
    this.uploadGalleryDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize().resolve("gallery").normalize();
    this.publicPath = normalizePublicPath(publicPath);
    this.enabled = enabled;
    this.configuredSourceDirectory = configuredSourceDirectory;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (!enabled || galleryPhotos.count() > 0) {
      return;
    }

    resolveSourceDirectory()
      .ifPresentOrElse(this::seedFrom, () -> log.info("Gallery seed source directory not found; skipping gallery seed."));
  }

  private void seedFrom(Path sourceDirectory) {
    try {
      var files = orderedGalleryFiles(sourceDirectory);
      Files.createDirectories(uploadGalleryDirectory);

      for (var index = 0; index < files.size(); index += 1) {
        var source = files.get(index);
        var fileName = source.getFileName().toString();
        if (galleryPhotos.existsByFileName(fileName)) {
          continue;
        }

        var target = uploadGalleryDirectory.resolve(fileName).normalize();
        if (!target.startsWith(uploadGalleryDirectory)) {
          continue;
        }

        if (!Files.exists(target)) {
          Files.copy(source, target);
        }

        var derivatives = imageDerivatives.createDerivatives(target, uploadGalleryDirectory, fileName);
        var detail = detailAt(index);
        var photo = new GalleryPhoto();
        photo.setTitle(detail.title());
        photo.setDescription(detail.description());
        photo.setLocation("生活图册");
        photo.setTakenAt(detail.date());
        photo.setSortOrder(index + 1);
        photo.setStatus(ContentStatus.PUBLISHED);
        photo.setFileName(fileName);
        photo.setMimeType(mimeTypeFor(fileName));
        photo.setSizeBytes(Files.size(source));
        photo.setUrl(toPublicUrl(fileName));
        photo.setThumbnailUrl(toPublicUrl(derivatives.thumbnailFileName()));
        photo.setMediumUrl(toPublicUrl(derivatives.mediumFileName()));
        galleryPhotos.save(photo);
      }

      log.info("Seeded {} gallery photos from {}.", files.size(), sourceDirectory);
    } catch (IOException error) {
      log.warn("Gallery seed failed: {}", error.getMessage());
    }
  }

  private List<Path> orderedGalleryFiles(Path sourceDirectory) throws IOException {
    List<Path> files;
    try (var stream = Files.list(sourceDirectory)) {
      files = stream
        .filter(Files::isRegularFile)
        .filter(path -> SUPPORTED_EXTENSIONS.contains(extensionOf(path.getFileName().toString())))
        .sorted(Comparator.comparingInt(path -> hashPath(FRONTEND_GALLERY_PREFIX + path.getFileName().toString())))
        .toList();
    }

    var ordered = new java.util.ArrayList<>(files);
    PLACEMENTS.entrySet().stream()
      .sorted(Map.Entry.comparingByValue())
      .forEach(entry -> moveFileToIndex(ordered, entry.getKey(), entry.getValue()));

    return ordered;
  }

  private void moveFileToIndex(List<Path> files, String fileName, int targetIndex) {
    var currentIndex = -1;
    for (var index = 0; index < files.size(); index += 1) {
      if (files.get(index).getFileName().toString().equals(fileName)) {
        currentIndex = index;
        break;
      }
    }

    if (currentIndex < 0) return;

    var file = files.remove(currentIndex);
    files.add(Math.min(targetIndex, files.size()), file);
  }

  private java.util.Optional<Path> resolveSourceDirectory() {
    return List.of(
        configuredSourceDirectory,
        "../docs/images/图册",
        "docs/images/图册"
      ).stream()
      .filter(StringUtils::hasText)
      .map(Path::of)
      .map(path -> path.toAbsolutePath().normalize())
      .filter(Files::isDirectory)
      .findFirst();
  }

  private PhotoDetail detailAt(int index) {
    if (index < PHOTO_DETAILS.size()) {
      return PHOTO_DETAILS.get(index);
    }

    return new PhotoDetail(
      "生活切片 %02d".formatted(index + 1),
      "图册里自然生长的一帧日常。",
      "2024"
    );
  }

  private int hashPath(String path) {
    var hash = 0;
    for (var index = 0; index < path.length(); index += 1) {
      hash = ((hash << 5) - hash + path.charAt(index));
    }
    return hash;
  }

  private String extensionOf(String fileName) {
    var dotIndex = fileName.lastIndexOf('.');
    return dotIndex > 0 ? fileName.substring(dotIndex).toLowerCase() : "";
  }

  private String mimeTypeFor(String fileName) {
    return switch (extensionOf(fileName)) {
      case ".png" -> "image/png";
      case ".webp" -> "image/webp";
      case ".avif" -> "image/avif";
      default -> "image/jpeg";
    };
  }

  private String toPublicUrl(String fileName) {
    return "%s/gallery/%s".formatted(publicPath, UriUtils.encodePathSegment(fileName, StandardCharsets.UTF_8));
  }

  private String normalizePublicPath(String value) {
    var normalized = StringUtils.hasText(value) ? value.trim() : "/uploads";
    normalized = normalized.startsWith("/") ? normalized : "/" + normalized;
    return normalized.replaceAll("/+$", "");
  }

  private record PhotoDetail(String title, String description, String date) {
  }
}
