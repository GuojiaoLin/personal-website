package com.guojiaolin.website.content;

import com.guojiaolin.website.common.ImageOrientation;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;

@Service
public class ProjectLogoImageService {

  private static final int MAX_SIDE = 1600;

  public ProcessedProjectLogo process(Path source, Path directory, String fileName, String mimeType) {
    var originalSize = sizeOf(source);
    if (!canRewrite(mimeType)) {
      return new ProcessedProjectLogo(fileName, mimeType, originalSize);
    }

    try {
      var sourceImage = ImageIO.read(source.toFile());
      if (sourceImage == null) {
        return new ProcessedProjectLogo(fileName, mimeType, originalSize);
      }

      var orientedImage = ImageOrientation.applyExifOrientation(source, sourceImage);
      var resizedImage = resizeToMaxSide(orientedImage);

      try {
        if (orientedImage == sourceImage && resizedImage == orientedImage) {
          return new ProcessedProjectLogo(fileName, mimeType, originalSize);
        }

        var destination = directory.resolve(fileName).normalize();
        if (!destination.startsWith(directory)) {
          return new ProcessedProjectLogo(fileName, mimeType, originalSize);
        }

        var temporary = Files.createTempFile(directory, "project-logo-", extensionFor(mimeType));
        try {
          var writableImage = imageForFormat(resizedImage, mimeType);
          try {
            if (!ImageIO.write(writableImage, formatName(mimeType), temporary.toFile())) {
              return new ProcessedProjectLogo(fileName, mimeType, originalSize);
            }
          } finally {
            if (writableImage != resizedImage) {
              writableImage.flush();
            }
          }

          Files.move(temporary, destination, StandardCopyOption.REPLACE_EXISTING);
        } finally {
          Files.deleteIfExists(temporary);
        }

        return new ProcessedProjectLogo(fileName, mimeType, Files.size(destination));
      } finally {
        if (resizedImage != orientedImage) {
          resizedImage.flush();
        }
        if (orientedImage != sourceImage) {
          orientedImage.flush();
        }
        sourceImage.flush();
      }
    } catch (IOException | RuntimeException error) {
      return new ProcessedProjectLogo(fileName, mimeType, originalSize);
    }
  }

  private boolean canRewrite(String mimeType) {
    return "image/png".equals(mimeType) || "image/jpeg".equals(mimeType);
  }

  private BufferedImage resizeToMaxSide(BufferedImage source) {
    var width = source.getWidth();
    var height = source.getHeight();
    var scale = Math.min(1d, (double) MAX_SIDE / Math.max(width, height));
    if (scale >= 1d) {
      return source;
    }

    var targetWidth = Math.max(1, (int) Math.round(width * scale));
    var targetHeight = Math.max(1, (int) Math.round(height * scale));
    var target = new BufferedImage(
      targetWidth,
      targetHeight,
      source.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB
    );
    var graphics = target.createGraphics();
    try {
      paintResizedImage(graphics, source, targetWidth, targetHeight);
    } finally {
      graphics.dispose();
    }

    return target;
  }

  private void paintResizedImage(Graphics2D graphics, BufferedImage source, int targetWidth, int targetHeight) {
    graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
    graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
    graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
  }

  private BufferedImage imageForFormat(BufferedImage source, String mimeType) {
    if (!"image/jpeg".equals(mimeType) || !source.getColorModel().hasAlpha()) {
      return source;
    }

    var target = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
    var graphics = target.createGraphics();
    try {
      graphics.setColor(Color.WHITE);
      graphics.fillRect(0, 0, source.getWidth(), source.getHeight());
      graphics.drawImage(source, 0, 0, null);
    } finally {
      graphics.dispose();
    }

    return target;
  }

  private String formatName(String mimeType) {
    return "image/jpeg".equals(mimeType) ? "jpg" : "png";
  }

  private String extensionFor(String mimeType) {
    return "image/jpeg".equals(mimeType) ? ".jpg" : ".png";
  }

  private long sizeOf(Path source) {
    try {
      return Files.size(source);
    } catch (IOException error) {
      return 0L;
    }
  }

  public record ProcessedProjectLogo(String fileName, String mimeType, long sizeBytes) {
  }
}
