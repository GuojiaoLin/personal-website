package com.guojiaolin.website.media;

import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class UploadResourceConfig implements WebMvcConfigurer {

  private final Path uploadDirectory;
  private final String publicPath;

  public UploadResourceConfig(
    @Value("${site.uploads.directory:uploads}") String uploadDirectory,
    @Value("${site.uploads.public-path:/uploads}") String publicPath
  ) {
    this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    this.publicPath = normalizePublicPath(publicPath);
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    var location = uploadDirectory.toUri().toString();
    if (!location.endsWith("/")) {
      location = location + "/";
    }

    registry
      .addResourceHandler(publicPath + "/**")
      .addResourceLocations(location);
  }

  private String normalizePublicPath(String value) {
    var normalized = StringUtils.hasText(value) ? value.trim() : "/uploads";
    normalized = normalized.startsWith("/") ? normalized : "/" + normalized;
    return normalized.replaceAll("/+$", "");
  }
}
