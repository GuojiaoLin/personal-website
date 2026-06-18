package com.guojiaolin.website.common;

import static org.assertj.core.api.Assertions.assertThat;

import com.guojiaolin.website.TestImages;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ImageUploadOptimizationServiceTest {

  @TempDir
  private Path uploadDirectory;

  private final ImageUploadOptimizationService service = new ImageUploadOptimizationService();

  @Test
  void appliesExifOrientationBeforeResizingUploadedJpegs() throws Exception {
    var fileName = "phone-photo.jpg";
    var source = uploadDirectory.resolve(fileName);
    Files.write(source, TestImages.createJpegWithExifOrientation(2400, 1800, 6));

    var optimized = service.optimize(source, uploadDirectory, fileName, "image/jpeg");

    var image = ImageIO.read(uploadDirectory.resolve(optimized.fileName()).toFile());
    assertThat(image.getWidth()).isEqualTo(1200);
    assertThat(image.getHeight()).isEqualTo(1600);
    image.flush();
  }
}
