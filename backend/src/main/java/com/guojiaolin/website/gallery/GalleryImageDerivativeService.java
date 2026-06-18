package com.guojiaolin.website.gallery;

import com.guojiaolin.website.common.ImageOrientation;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.stereotype.Service;

@Service
public class GalleryImageDerivativeService {

  private static final int THUMBNAIL_MAX_SIDE = 640;
  private static final int MEDIUM_MAX_SIDE = 1600;
  private static final float JPEG_QUALITY = 0.78f;

  public GalleryImageDerivatives createDerivatives(Path source, Path directory, String originalFileName) {
    var thumbnailFileName = derivativeFileName(originalFileName, "thumbnail");
    var mediumFileName = derivativeFileName(originalFileName, "medium");

    try {
      var sourceImage = ImageIO.read(source.toFile());
      if (sourceImage == null) {
        return GalleryImageDerivatives.original(originalFileName);
      }

      var orientedImage = ImageOrientation.applyExifOrientation(source, sourceImage);
      try {
        writeResizedJpeg(orientedImage, directory.resolve(thumbnailFileName), THUMBNAIL_MAX_SIDE);
        writeResizedJpeg(orientedImage, directory.resolve(mediumFileName), MEDIUM_MAX_SIDE);
      } finally {
        if (orientedImage != sourceImage) {
          orientedImage.flush();
        }
      }
      sourceImage.flush();

      return new GalleryImageDerivatives(thumbnailFileName, mediumFileName);
    } catch (IOException | RuntimeException error) {
      return GalleryImageDerivatives.original(originalFileName);
    }
  }

  public static String derivativeFileName(String fileName, String variant) {
    var dotIndex = fileName.lastIndexOf('.');
    var baseName = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
    return "%s-%s.jpg".formatted(baseName, variant);
  }

  private void writeResizedJpeg(BufferedImage source, Path destination, int maxSide) throws IOException {
    Files.createDirectories(destination.getParent());

    var resized = resizeToMaxSide(source, maxSide);
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

  private BufferedImage resizeToMaxSide(BufferedImage source, int maxSide) {
    var width = source.getWidth();
    var height = source.getHeight();
    var scale = Math.min(1d, (double) maxSide / Math.max(width, height));
    var targetWidth = Math.max(1, (int) Math.round(width * scale));
    var targetHeight = Math.max(1, (int) Math.round(height * scale));

    var target = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
    var graphics = target.createGraphics();
    try {
      graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
      graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
      graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
      graphics.setColor(Color.WHITE);
      graphics.fillRect(0, 0, targetWidth, targetHeight);
      graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
    } finally {
      graphics.dispose();
    }

    return target;
  }
}

record GalleryImageDerivatives(String thumbnailFileName, String mediumFileName) {

  static GalleryImageDerivatives original(String originalFileName) {
    return new GalleryImageDerivatives(originalFileName, originalFileName);
  }
}
