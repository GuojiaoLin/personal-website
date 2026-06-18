package com.guojiaolin.website.home;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.guojiaolin.website.TestImages;
import com.guojiaolin.website.common.ImageUploadOptimizationService;
import com.guojiaolin.website.gallery.GalleryPhotoRepository;
import java.nio.file.Path;
import java.util.Optional;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class HomeGallerySlotServiceTest {

  @TempDir
  private Path uploadDirectory;

  @Test
  void localSlotUploadsAreOptimizedAndOrientedBeforeFrontEndUsesThem() throws Exception {
    var homeGallerySlots = mock(HomeGallerySlotRepository.class);
    var galleryPhotos = mock(GalleryPhotoRepository.class);
    when(homeGallerySlots.findBySlotKey(eq("life-card"))).thenReturn(Optional.empty());
    when(homeGallerySlots.save(any(HomeGallerySlot.class))).thenAnswer((invocation) -> invocation.getArgument(0));

    var service = new HomeGallerySlotService(
      homeGallerySlots,
      galleryPhotos,
      new ImageUploadOptimizationService(),
      uploadDirectory.toString(),
      "/uploads"
    );
    var file = new MockMultipartFile(
      "file",
      "phone-photo.jpg",
      "image/jpeg",
      TestImages.createJpegWithExifOrientation(2400, 1800, 6)
    );

    var response = service.uploadImage("life-card", file);

    var photo = response.photo();
    assertThat(photo.url()).isEqualTo("/uploads/home/phone-photo.jpg");
    assertThat(photo.thumbnailUrl()).isEqualTo(photo.url());
    assertThat(photo.mediumUrl()).isEqualTo(photo.url());

    var image = ImageIO.read(uploadDirectory.resolve("home").resolve(photo.fileName()).toFile());
    assertThat(image.getWidth()).isEqualTo(1200);
    assertThat(image.getHeight()).isEqualTo(1600);
    image.flush();
  }
}
