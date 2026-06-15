package com.guojiaolin.website;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
  "site.gallery.seed.enabled=true",
  "site.gallery.seed.source-directory=src/test/resources/gallery-seed-source",
  "site.uploads.directory=target/test-gallery-seed-uploads"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GalleryPhotoSeedIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void staticGallerySeedImportsPublishedPhotosForPublicGallery() throws Exception {
    mockMvc.perform(get("/api/gallery-photos"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(2)))
      .andExpect(jsonPath("$.items[0].status").value("published"))
      .andExpect(jsonPath("$.items[0].url").value(startsWith("/uploads/gallery/")));

    assertThat(Files.exists(Path.of("target/test-gallery-seed-uploads/gallery/seed-one.jpg"))).isTrue();
    assertThat(Files.exists(Path.of("target/test-gallery-seed-uploads/gallery/seed-two.png"))).isTrue();
  }
}
