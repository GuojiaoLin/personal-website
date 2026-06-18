package com.guojiaolin.website.common;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.stereotype.Service;

@Service
public class ImageUploadOptimizationService {

  private static final int MAX_SIDE = 1600;
  private static final long OPTIMIZE_SIZE_THRESHOLD_BYTES = 500L * 1024L;
  private static final float JPEG_QUALITY = 0.78f;

  public OptimizedImage optimize(Path source, Path directory, String fileName, String mimeType) {
    var originalSize = sizeOf(source);

    if (!isOptimizableMimeType(mimeType)) {
      return new OptimizedImage(fileName, mimeType, originalSize);
    }

    try {
      var sourceImage = ImageIO.read(source.toFile());
      if (sourceImage == null) {
        return new OptimizedImage(fileName, mimeType, originalSize);
      }

      var orientedImage = ImageOrientation.applyExifOrientation(source, sourceImage);
      var needsOrientationRewrite = orientedImage != sourceImage;

      if (!needsOrientationRewrite && originalSize <= OPTIMIZE_SIZE_THRESHOLD_BYTES && longestSide(sourceImage) <= MAX_SIDE) {
        sourceImage.flush();
        return new OptimizedImage(fileName, mimeType, originalSize);
      }

      var optimizedFileName = isJpegFileName(fileName) ? fileName : resolveAvailableJpegFileName(directory, fileName);
      var destination = directory.resolve(optimizedFileName).normalize();
      if (!destination.startsWith(directory)) {
        if (orientedImage != sourceImage) {
          orientedImage.flush();
        }
        sourceImage.flush();
        return new OptimizedImage(fileName, mimeType, originalSize);
      }

      var temporary = Files.createTempFile(directory, "optimized-", ".jpg");
      try {
        writeResizedJpeg(orientedImage, temporary);
        Files.move(temporary, destination, StandardCopyOption.REPLACE_EXISTING);
        if (!destination.equals(source)) {
          Files.deleteIfExists(source);
        }
      } finally {
        Files.deleteIfExists(temporary);
        if (orientedImage != sourceImage) {
          orientedImage.flush();
        }
        sourceImage.flush();
      }

      return new OptimizedImage(optimizedFileName, "image/jpeg", Files.size(destination));
    } catch (IOException | RuntimeException error) {
      return new OptimizedImage(fileName, mimeType, originalSize);
    }
  }

  private boolean isOptimizableMimeType(String mimeType) {
    return "image/jpeg".equals(mimeType) || "image/png".equals(mimeType);
  }

  private boolean isJpegFileName(String fileName) {
    var normalized = fileName.toLowerCase();
    return normalized.endsWith(".jpg") || normalized.endsWith(".jpeg");
  }

  private String resolveAvailableJpegFileName(Path directory, String fileName) {
    var dotIndex = fileName.lastIndexOf('.');
    var baseName = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
    var candidate = baseName + ".jpg";
    var counter = 2;

    while (Files.exists(directory.resolve(candidate))) {
      candidate = "%s-%d.jpg".formatted(baseName, counter);
      counter += 1;
    }

    return candidate;
  }

  private void writeResizedJpeg(BufferedImage source, Path destination) throws IOException {
    var resized = resizeToMaxSide(source);
    var writers = ImageIO.getImageWritersByFormatName("jpg");
    if (!writers.hasNext()) {
      throw new IOException("No JPEG writer available.");
    }

    var writer = writers.next();
    try (ImageOutputStream output = ImageIO.createImageOutputStream(destination.toFile())) {
      var parameters = writer.getDefaultWriteParam();
      if (parameters.canWriteCompressed()) {
        parameters.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        parameters.setCompressionQuality(JPEG_QUALITY);
      }

      writer.setOutput(output);
      writer.write(null, new IIOImage(resized, null, null), parameters);
    } finally {
      writer.dispose();
      resized.flush();
    }
  }

  private BufferedImage resizeToMaxSide(BufferedImage source) {
    var width = source.getWidth();
    var height = source.getHeight();
    var scale = Math.min(1d, (double) MAX_SIDE / Math.max(width, height));
    var targetWidth = Math.max(1, (int) Math.round(width * scale));
    var targetHeight = Math.max(1, (int) Math.round(height * scale));

    var target = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
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
    graphics.setColor(Color.WHITE);
    graphics.fillRect(0, 0, targetWidth, targetHeight);
    graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
  }

  private int longestSide(BufferedImage image) {
    return Math.max(image.getWidth(), image.getHeight());
  }

  private long sizeOf(Path source) {
    try {
      return Files.size(source);
    } catch (IOException error) {
      return 0L;
    }
  }

  public record OptimizedImage(String fileName, String mimeType, long sizeBytes) {
  }
}
