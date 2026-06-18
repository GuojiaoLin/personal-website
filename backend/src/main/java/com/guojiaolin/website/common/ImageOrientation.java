package com.guojiaolin.website.common;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public final class ImageOrientation {

  private static final int NORMAL = 1;
  private static final int EXIF_APP1_MARKER = 0xe1;
  private static final int START_OF_SCAN_MARKER = 0xda;
  private static final int END_OF_IMAGE_MARKER = 0xd9;
  private static final int ORIENTATION_TAG = 0x0112;

  private ImageOrientation() {
  }

  public static BufferedImage applyExifOrientation(Path source, BufferedImage image) {
    var orientation = readExifOrientation(source);

    if (orientation == NORMAL) {
      return image;
    }

    return orient(image, orientation);
  }

  private static int readExifOrientation(Path source) {
    try {
      var bytes = Files.readAllBytes(source);
      return readExifOrientation(bytes);
    } catch (IOException | RuntimeException error) {
      return NORMAL;
    }
  }

  private static int readExifOrientation(byte[] bytes) {
    if (bytes.length < 4 || unsigned(bytes[0]) != 0xff || unsigned(bytes[1]) != 0xd8) {
      return NORMAL;
    }

    var index = 2;
    while (index + 4 <= bytes.length) {
      if (unsigned(bytes[index]) != 0xff) {
        return NORMAL;
      }

      while (index < bytes.length && unsigned(bytes[index]) == 0xff) {
        index += 1;
      }

      if (index >= bytes.length) {
        return NORMAL;
      }

      var marker = unsigned(bytes[index]);
      index += 1;

      if (marker == START_OF_SCAN_MARKER || marker == END_OF_IMAGE_MARKER) {
        return NORMAL;
      }

      if (index + 2 > bytes.length) {
        return NORMAL;
      }

      var length = readUnsignedShort(bytes, index, false);
      if (length < 2 || index + length > bytes.length) {
        return NORMAL;
      }

      var segmentStart = index + 2;
      var segmentLength = length - 2;
      if (marker == EXIF_APP1_MARKER && hasExifHeader(bytes, segmentStart, segmentLength)) {
        return readTiffOrientation(bytes, segmentStart + 6, segmentLength - 6);
      }

      index += length;
    }

    return NORMAL;
  }

  private static boolean hasExifHeader(byte[] bytes, int start, int length) {
    return length >= 6
      && bytes[start] == 'E'
      && bytes[start + 1] == 'x'
      && bytes[start + 2] == 'i'
      && bytes[start + 3] == 'f'
      && bytes[start + 4] == 0
      && bytes[start + 5] == 0;
  }

  private static int readTiffOrientation(byte[] bytes, int tiffStart, int tiffLength) {
    if (tiffLength < 14) {
      return NORMAL;
    }

    var littleEndian = bytes[tiffStart] == 'I' && bytes[tiffStart + 1] == 'I';
    var bigEndian = bytes[tiffStart] == 'M' && bytes[tiffStart + 1] == 'M';
    if (!littleEndian && !bigEndian) {
      return NORMAL;
    }

    if (readUnsignedShort(bytes, tiffStart + 2, littleEndian) != 42) {
      return NORMAL;
    }

    var ifdOffset = readInt(bytes, tiffStart + 4, littleEndian);
    if (ifdOffset < 8 || ifdOffset > tiffLength - 2) {
      return NORMAL;
    }

    var ifdStart = tiffStart + ifdOffset;
    var entryCount = readUnsignedShort(bytes, ifdStart, littleEndian);
    var entryStart = ifdStart + 2;

    for (var entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
      var entry = entryStart + entryIndex * 12;
      if (entry + 12 > tiffStart + tiffLength) {
        return NORMAL;
      }

      var tag = readUnsignedShort(bytes, entry, littleEndian);
      if (tag == ORIENTATION_TAG) {
        var orientation = readUnsignedShort(bytes, entry + 8, littleEndian);
        return orientation >= 1 && orientation <= 8 ? orientation : NORMAL;
      }
    }

    return NORMAL;
  }

  private static BufferedImage orient(BufferedImage source, int orientation) {
    var width = source.getWidth();
    var height = source.getHeight();
    var swapsDimensions = orientation >= 5 && orientation <= 8;
    var targetWidth = swapsDimensions ? height : width;
    var targetHeight = swapsDimensions ? width : height;
    var target = new BufferedImage(targetWidth, targetHeight, source.getColorModel().hasAlpha()
      ? BufferedImage.TYPE_INT_ARGB
      : BufferedImage.TYPE_INT_RGB);

    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        var rgb = source.getRGB(x, y);
        var targetX = x;
        var targetY = y;

        switch (orientation) {
          case 2 -> targetX = width - 1 - x;
          case 3 -> {
            targetX = width - 1 - x;
            targetY = height - 1 - y;
          }
          case 4 -> targetY = height - 1 - y;
          case 5 -> {
            targetX = y;
            targetY = x;
          }
          case 6 -> {
            targetX = height - 1 - y;
            targetY = x;
          }
          case 7 -> {
            targetX = height - 1 - y;
            targetY = width - 1 - x;
          }
          case 8 -> {
            targetX = y;
            targetY = width - 1 - x;
          }
          default -> {
          }
        }

        target.setRGB(targetX, targetY, rgb);
      }
    }

    return target;
  }

  private static int readUnsignedShort(byte[] bytes, int index, boolean littleEndian) {
    if (littleEndian) {
      return unsigned(bytes[index]) | (unsigned(bytes[index + 1]) << 8);
    }

    return (unsigned(bytes[index]) << 8) | unsigned(bytes[index + 1]);
  }

  private static int readInt(byte[] bytes, int index, boolean littleEndian) {
    if (littleEndian) {
      return unsigned(bytes[index])
        | (unsigned(bytes[index + 1]) << 8)
        | (unsigned(bytes[index + 2]) << 16)
        | (unsigned(bytes[index + 3]) << 24);
    }

    return (unsigned(bytes[index]) << 24)
      | (unsigned(bytes[index + 1]) << 16)
      | (unsigned(bytes[index + 2]) << 8)
      | unsigned(bytes[index + 3]);
  }

  private static int unsigned(byte value) {
    return value & 0xff;
  }
}
