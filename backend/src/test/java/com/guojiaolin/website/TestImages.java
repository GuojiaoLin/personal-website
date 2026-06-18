package com.guojiaolin.website;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

public final class TestImages {

  private TestImages() {
  }

  public static byte[] createJpegWithExifOrientation(int width, int height, int orientation) throws Exception {
    var image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        var red = (x * 17 + y * 3) % 256;
        var green = (x * 5 + y * 13) % 256;
        var blue = (x * 11 + y * 7) % 256;
        image.setRGB(x, y, (red << 16) | (green << 8) | blue);
      }
    }

    var output = new ByteArrayOutputStream();
    ImageIO.write(image, "jpg", output);
    image.flush();
    return insertExifOrientation(output.toByteArray(), orientation);
  }

  private static byte[] insertExifOrientation(byte[] jpegBytes, int orientation) {
    if (jpegBytes.length < 2 || (jpegBytes[0] & 0xff) != 0xff || (jpegBytes[1] & 0xff) != 0xd8) {
      throw new IllegalArgumentException("Expected JPEG bytes.");
    }

    var app1 = exifOrientationSegment(orientation);
    var output = new ByteArrayOutputStream(jpegBytes.length + app1.length);
    output.write(jpegBytes, 0, 2);
    output.writeBytes(app1);
    output.write(jpegBytes, 2, jpegBytes.length - 2);
    return output.toByteArray();
  }

  private static byte[] exifOrientationSegment(int orientation) {
    return new byte[] {
      (byte) 0xff, (byte) 0xe1,
      0x00, 0x22,
      0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
      0x49, 0x49, 0x2a, 0x00,
      0x08, 0x00, 0x00, 0x00,
      0x01, 0x00,
      0x12, 0x01,
      0x03, 0x00,
      0x01, 0x00, 0x00, 0x00,
      (byte) orientation, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
    };
  }
}
