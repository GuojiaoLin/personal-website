package com.guojiaolin.website.content;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.nio.file.StandardCopyOption;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ProjectLogoImageServiceTest {

  @TempDir
  private Path uploadDirectory;

  private final ProjectLogoImageService service = new ProjectLogoImageService();

  @Test
  void replacesEdgeConnectedBackgroundWithYellowPng() throws Exception {
    var source = uploadDirectory.resolve("cat-logo.jpg");
    ImageIO.write(createLogoWithBackground(), "png", source.toFile());

    var processed = service.process(source, uploadDirectory, "cat-logo.jpg", "image/jpeg");

    assertThat(processed.fileName()).isEqualTo("cat-logo.png");
    assertThat(processed.mimeType()).isEqualTo("image/png");
    assertThat(Files.exists(source)).isFalse();

    var logo = ImageIO.read(uploadDirectory.resolve(processed.fileName()).toFile());
    assertThat(rgbAt(logo, 0, 0)).isEqualTo(0xffff00);
    assertThat(rgbAt(logo, 2, 8)).isEqualTo(0xffff00);
    assertThat(rgbAt(logo, 8, 8)).isEqualTo(new Color(24, 112, 220).getRGB() & 0xffffff);
    logo.flush();
  }

  @Test
  void processesUploadedGeneratedLogoImage() throws Exception {
    var source = uploadDirectory.resolve("generated-logo.png");
    Files.copy(Path.of("..", "design", "logo.png"), source, StandardCopyOption.REPLACE_EXISTING);

    var processed = service.process(source, uploadDirectory, "generated-logo.png", "image/png");

    assertThat(processed.fileName()).isEqualTo("generated-logo.png");
    assertThat(processed.mimeType()).isEqualTo("image/png");
    assertThat(Files.exists(uploadDirectory.resolve(processed.fileName()))).isTrue();

    var logo = ImageIO.read(uploadDirectory.resolve(processed.fileName()).toFile());
    assertThat(rgbAt(logo, 0, 0)).isEqualTo(0xffff00);
    logo.flush();
  }

  @Test
  void preservesInteriorLogoArtworkWhenReplacingWhiteCanvas() throws Exception {
    var sourceImagePath = Path.of("..", "design", "logo - \u526f\u672c.png");
    var source = uploadDirectory.resolve("customer-service-logo.png");
    Files.copy(sourceImagePath, source, StandardCopyOption.REPLACE_EXISTING);

    var processed = service.process(source, uploadDirectory, "customer-service-logo.png", "image/png");

    var original = ImageIO.read(sourceImagePath.toFile());
    var logo = ImageIO.read(uploadDirectory.resolve(processed.fileName()).toFile());
    assertThat(rgbAt(logo, 0, 0)).isEqualTo(0xffff00);
    assertThat(rgbAt(logo, 100, 100)).isEqualTo(0xffff00);
    assertThat(rgbAt(logo, 390, 620)).isEqualTo(rgbAt(original, 390, 620));
    assertThat(rgbAt(logo, 627, 520)).isEqualTo(rgbAt(original, 627, 520));
    assertThat(rgbAt(logo, 900, 620)).isEqualTo(rgbAt(original, 900, 620));
    original.flush();
    logo.flush();
  }

  private BufferedImage createLogoWithBackground() {
    var image = new BufferedImage(16, 16, BufferedImage.TYPE_INT_RGB);
    for (var y = 0; y < image.getHeight(); y += 1) {
      for (var x = 0; x < image.getWidth(); x += 1) {
        var background = new Color(54 + x * 3, 38 + y * 2, 24 + x + y).getRGB();
        image.setRGB(x, y, background);
      }
    }

    for (var y = 5; y < 12; y += 1) {
      for (var x = 5; x < 12; x += 1) {
        image.setRGB(x, y, new Color(24, 112, 220).getRGB());
      }
    }

    return image;
  }

  private int rgbAt(BufferedImage image, int x, int y) {
    return image.getRGB(x, y) & 0xffffff;
  }
}
