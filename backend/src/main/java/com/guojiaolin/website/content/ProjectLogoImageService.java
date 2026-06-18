package com.guojiaolin.website.content;

import com.guojiaolin.website.common.ImageOrientation;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayDeque;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;

@Service
public class ProjectLogoImageService {

  private static final int MAX_SIDE = 1600;
  private static final int YELLOW_RGB = 0xffff00;
  private static final int EDGE_BACKGROUND_DISTANCE = 130;
  private static final int LOCAL_BACKGROUND_DISTANCE = 58;

  public ProcessedProjectLogo process(Path source, Path directory, String fileName, String mimeType) {
    var originalSize = sizeOf(source);

    try {
      var sourceImage = ImageIO.read(source.toFile());
      if (sourceImage == null) {
        return new ProcessedProjectLogo(fileName, mimeType, originalSize);
      }

      var orientedImage = ImageOrientation.applyExifOrientation(source, sourceImage);
      var resizedImage = resizeToMaxSide(orientedImage);
      var logoImage = paintOnYellowBackground(resizedImage);
      var processedFileName = resolveAvailablePngFileName(directory, source, fileName);
      var destination = directory.resolve(processedFileName).normalize();

      if (!destination.startsWith(directory)) {
        return new ProcessedProjectLogo(fileName, mimeType, originalSize);
      }

      var temporary = Files.createTempFile(directory, "project-logo-", ".png");
      try {
        ImageIO.write(logoImage, "png", temporary.toFile());
        Files.move(temporary, destination, StandardCopyOption.REPLACE_EXISTING);
        if (!destination.equals(source)) {
          Files.deleteIfExists(source);
        }
      } finally {
        Files.deleteIfExists(temporary);
        logoImage.flush();
        resizedImage.flush();
        if (orientedImage != sourceImage) {
          orientedImage.flush();
        }
        sourceImage.flush();
      }

      return new ProcessedProjectLogo(processedFileName, "image/png", Files.size(destination));
    } catch (IOException | RuntimeException error) {
      return new ProcessedProjectLogo(fileName, mimeType, originalSize);
    }
  }

  private BufferedImage paintOnYellowBackground(BufferedImage source) {
    var width = source.getWidth();
    var height = source.getHeight();
    var background = findEdgeConnectedBackground(source);
    var target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        var argb = source.getRGB(x, y);
        var alpha = alphaOf(argb);

        if (background[y * width + x] || alpha < 16) {
          target.setRGB(x, y, YELLOW_RGB);
        } else if (alpha < 255) {
          target.setRGB(x, y, blendOverYellow(argb, alpha));
        } else {
          target.setRGB(x, y, argb & 0xffffff);
        }
      }
    }

    return target;
  }

  private boolean[] findEdgeConnectedBackground(BufferedImage image) {
    var width = image.getWidth();
    var height = image.getHeight();
    var background = new boolean[width * height];
    var queue = new ArrayDeque<Integer>();
    var edgeColors = sampleCornerBackgroundColors(image);

    for (var x = 0; x < width; x += 1) {
      seedBackground(image, background, queue, edgeColors, x, 0);
      seedBackground(image, background, queue, edgeColors, x, height - 1);
    }
    for (var y = 1; y < height - 1; y += 1) {
      seedBackground(image, background, queue, edgeColors, 0, y);
      seedBackground(image, background, queue, edgeColors, width - 1, y);
    }

    if (queue.isEmpty()) {
      seedBackgroundUnchecked(background, queue, 0);
      seedBackgroundUnchecked(background, queue, width - 1);
      seedBackgroundUnchecked(background, queue, (height - 1) * width);
      seedBackgroundUnchecked(background, queue, height * width - 1);
    }

    while (!queue.isEmpty()) {
      var index = queue.removeFirst();
      var x = index % width;
      var y = index / width;
      var current = image.getRGB(x, y);

      addNeighbor(image, background, queue, edgeColors, current, x - 1, y);
      addNeighbor(image, background, queue, edgeColors, current, x + 1, y);
      addNeighbor(image, background, queue, edgeColors, current, x, y - 1);
      addNeighbor(image, background, queue, edgeColors, current, x, y + 1);
    }

    return background;
  }

  private void seedBackground(
    BufferedImage image,
    boolean[] background,
    ArrayDeque<Integer> queue,
    int[] edgeColors,
    int x,
    int y
  ) {
    var rgb = image.getRGB(x, y);
    if (alphaOf(rgb) < 250 || isCloseToEdgeBackground(rgb, edgeColors)) {
      seedBackgroundUnchecked(background, queue, y * image.getWidth() + x);
    }
  }

  private void seedBackgroundUnchecked(boolean[] background, ArrayDeque<Integer> queue, int index) {
    if (!background[index]) {
      background[index] = true;
      queue.add(index);
    }
  }

  private void addNeighbor(
    BufferedImage image,
    boolean[] background,
    ArrayDeque<Integer> queue,
    int[] edgeColors,
    int currentRgb,
    int x,
    int y
  ) {
    if (x < 0 || y < 0 || x >= image.getWidth() || y >= image.getHeight()) {
      return;
    }

    var index = y * image.getWidth() + x;
    if (background[index]) {
      return;
    }

    var nextRgb = image.getRGB(x, y);
    if (alphaOf(nextRgb) < 250
      || colorDistance(nextRgb, currentRgb) <= LOCAL_BACKGROUND_DISTANCE
      || isCloseToEdgeBackground(nextRgb, edgeColors)) {
      background[index] = true;
      queue.add(index);
    }
  }

  private int[] sampleCornerBackgroundColors(BufferedImage image) {
    var width = image.getWidth();
    var height = image.getHeight();
    var sampleWidth = Math.max(1, Math.min(12, width / 8));
    var sampleHeight = Math.max(1, Math.min(12, height / 8));

    return new int[] {
      averageRegion(image, 0, 0, sampleWidth, sampleHeight),
      averageRegion(image, width - sampleWidth, 0, sampleWidth, sampleHeight),
      averageRegion(image, 0, height - sampleHeight, sampleWidth, sampleHeight),
      averageRegion(image, width - sampleWidth, height - sampleHeight, sampleWidth, sampleHeight)
    };
  }

  private int averageRegion(BufferedImage image, int startX, int startY, int width, int height) {
    long red = 0;
    long green = 0;
    long blue = 0;
    var count = 0;

    for (var y = startY; y < startY + height; y += 1) {
      for (var x = startX; x < startX + width; x += 1) {
        var rgb = image.getRGB(x, y);
        if (alphaOf(rgb) < 16) {
          continue;
        }

        red += (rgb >> 16) & 0xff;
        green += (rgb >> 8) & 0xff;
        blue += rgb & 0xff;
        count += 1;
      }
    }

    if (count == 0) {
      return YELLOW_RGB;
    }

    return ((int) (red / count) << 16) | ((int) (green / count) << 8) | (int) (blue / count);
  }

  private boolean isCloseToEdgeBackground(int rgb, int[] edgeColors) {
    for (var edgeColor : edgeColors) {
      if (colorDistance(rgb, edgeColor) <= EDGE_BACKGROUND_DISTANCE) {
        return true;
      }
    }

    return false;
  }

  private int colorDistance(int first, int second) {
    var red = ((first >> 16) & 0xff) - ((second >> 16) & 0xff);
    var green = ((first >> 8) & 0xff) - ((second >> 8) & 0xff);
    var blue = (first & 0xff) - (second & 0xff);
    return (int) Math.round(Math.sqrt(red * red + green * green + blue * blue));
  }

  private int blendOverYellow(int argb, int alpha) {
    var red = ((argb >> 16) & 0xff) * alpha + 255 * (255 - alpha);
    var green = ((argb >> 8) & 0xff) * alpha + 255 * (255 - alpha);
    var blue = (argb & 0xff) * alpha;
    return ((red / 255) << 16) | ((green / 255) << 8) | (blue / 255);
  }

  private BufferedImage resizeToMaxSide(BufferedImage source) {
    var width = source.getWidth();
    var height = source.getHeight();
    var scale = Math.min(1d, (double) MAX_SIDE / Math.max(width, height));
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

  private String resolveAvailablePngFileName(Path directory, Path source, String fileName) {
    var dotIndex = fileName.lastIndexOf('.');
    var baseName = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
    var candidate = baseName + ".png";
    var counter = 2;

    while (candidateExistsForAnotherSource(directory, source, candidate)) {
      candidate = "%s-%d.png".formatted(baseName, counter);
      counter += 1;
    }

    return candidate;
  }

  private boolean candidateExistsForAnotherSource(Path directory, Path source, String candidate) {
    var destination = directory.resolve(candidate).normalize();
    return Files.exists(destination) && !destination.equals(source);
  }

  private int alphaOf(int argb) {
    return (argb >>> 24) & 0xff;
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
