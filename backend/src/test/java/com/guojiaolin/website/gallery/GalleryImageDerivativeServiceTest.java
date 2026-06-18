package com.guojiaolin.website.gallery;

import static org.assertj.core.api.Assertions.assertThat;

import com.guojiaolin.website.TestImages;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class GalleryImageDerivativeServiceTest {

  @TempDir
  private Path uploadDirectory;

  private final GalleryImageDerivativeService service = new GalleryImageDerivativeService();

  @Test
  void appliesExifOrientationBeforeCreatingDerivativeImages() throws Exception {
    var fileName = "gallery-photo.jpg";
    var source = uploadDirectory.resolve(fileName);
    Files.write(source, TestImages.createJpegWithExifOrientation(2400, 1800, 6));

    var derivatives = service.createDerivatives(source, uploadDirectory, fileName);

    var thumbnail = ImageIO.read(uploadDirectory.resolve(derivatives.thumbnailFileName()).toFile());
    assertThat(thumbnail.getWidth()).isEqualTo(480);
    assertThat(thumbnail.getHeight()).isEqualTo(640);
    thumbnail.flush();

    var medium = ImageIO.read(uploadDirectory.resolve(derivatives.mediumFileName()).toFile());
    assertThat(medium.getWidth()).isEqualTo(1200);
    assertThat(medium.getHeight()).isEqualTo(1600);
    medium.flush();
  }
}
