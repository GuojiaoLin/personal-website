package com.guojiaolin.website;

import static com.guojiaolin.website.TestImages.createJpegWithExifOrientation;
import static org.hamcrest.Matchers.hasSize;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContentApiIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void ownerCanManagePublishedProjectAndMarkdownBlogPost() throws Exception {
    var session = login();

    var projectResponse = mockMvc.perform(post("/api/admin/projects")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "title": "多模态智能客服",
            "slug": "mmcsa",
            "summary": "图片和文本一起检索的客服 Agent。",
            "descriptionMarkdown": "## 项目简介\\n这是一个完整项目。",
            "coverImageUrl": "/uploads/mmcsa.png",
            "projectIcon": "bot",
            "techStack": ["React", "Spring Boot", "PostgreSQL"],
            "sortOrder": 10,
            "status": "published"
          }
          """))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.slug").value("mmcsa"))
      .andExpect(jsonPath("$.projectIcon").value("bot"))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var projectId = JsonField.extract(projectResponse, "id");

    mockMvc.perform(get("/api/projects"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(1)))
      .andExpect(jsonPath("$.items[0].title").value("多模态智能客服"))
      .andExpect(jsonPath("$.items[0].projectIcon").value("bot"));

    mockMvc.perform(post("/api/admin/blog-posts")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "projectId": "%s",
            "title": "RAG 检索链路拆解",
            "slug": "rag-retrieval",
            "category": "检索链路",
            "summary": "拆开看检索链路每一步。",
            "contentMarkdown": "## 检索链路\\n\\n这里是正文。",
            "blogOrder": 3,
            "coverImageUrl": "/uploads/rag.png",
            "status": "published"
          }
          """.formatted(projectId)))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.contentMarkdown").value("## 检索链路\n\n这里是正文。"));

    mockMvc.perform(get("/api/blog-posts/rag-retrieval"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.projectSlug").value("mmcsa"))
      .andExpect(jsonPath("$.contentMarkdown").value("## 检索链路\n\n这里是正文。"));
  }

  @Test
  void ownerCanUploadAndListMediaAssets() throws Exception {
    var session = login();
    var projectId = createPublishedProject(session, "media-project-" + System.nanoTime());
    var firstBlogPostId = createPublishedBlogPost(session, projectId, "media-one", "Media one");
    var secondBlogPostId = createPublishedBlogPost(session, projectId, "media-two", "Media two");
    var fileName = "Pasted image %d.png".formatted(System.nanoTime());
    var image = new MockMultipartFile("file", fileName, "image/png", new byte[] { 1, 2, 3 });

    mockMvc.perform(multipart("/api/admin/media-assets")
        .file(image)
        .param("blogPostId", firstBlogPostId)
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.fileName").value(fileName))
      .andExpect(jsonPath("$.blogPostId").value(firstBlogPostId))
      .andExpect(jsonPath("$.url").value("/uploads/" + fileName.replace(" ", "%20")));

    mockMvc.perform(get("/api/admin/media-assets").param("blogPostId", firstBlogPostId).session(session))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(1)))
      .andExpect(jsonPath("$.items[0].fileName").value(fileName));

    mockMvc.perform(get("/api/admin/media-assets").param("blogPostId", secondBlogPostId).session(session))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(0)));

    var assetId = JsonField.extract(
      mockMvc.perform(get("/api/admin/media-assets").param("blogPostId", firstBlogPostId).session(session))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString(),
      "id"
    );

    mockMvc.perform(delete("/api/admin/media-assets/%s".formatted(assetId)).with(csrf()).session(session))
      .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/admin/media-assets").param("blogPostId", firstBlogPostId).session(session))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(0)));
  }

  @Test
  void mediaAssetUploadOptimizesLargeBlogImages() throws Exception {
    var session = login();
    var projectId = createPublishedProject(session, "optimized-media-project-" + System.nanoTime());
    var blogPostId = createPublishedBlogPost(session, projectId, "optimized-media", "Optimized media");
    var fileName = "large blog image %d.png".formatted(System.nanoTime());
    var baseName = fileName.substring(0, fileName.lastIndexOf('.'));
    var originalBytes = createPngBytes(1800, 1200);
    var image = new MockMultipartFile("file", fileName, "image/png", originalBytes);

    var response = mockMvc.perform(multipart("/api/admin/media-assets")
        .file(image)
        .param("blogPostId", blogPostId)
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.fileName").value(baseName + ".jpg"))
      .andExpect(jsonPath("$.mimeType").value("image/jpeg"))
      .andExpect(jsonPath("$.url").value("/uploads/" + baseName.replace(" ", "%20") + ".jpg"))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var optimizedPath = Path.of("target/test-uploads").resolve(JsonField.extract(response, "fileName"));
    assertImageLongestSideAtMost(optimizedPath, 1600);
    assertThat(Files.size(optimizedPath)).isLessThan((long) originalBytes.length);
  }

  @Test
  void mediaAssetUploadAppliesExifOrientationEvenWhenImageDoesNotNeedResizing() throws Exception {
    var session = login();
    var projectId = createPublishedProject(session, "oriented-media-project-" + System.nanoTime());
    var blogPostId = createPublishedBlogPost(session, projectId, "oriented-media", "Oriented media");
    var fileName = "oriented blog image %d.jpg".formatted(System.nanoTime());
    var image = new MockMultipartFile(
      "file",
      fileName,
      "image/jpeg",
      createJpegWithExifOrientation(1200, 800, 6)
    );

    var response = mockMvc.perform(multipart("/api/admin/media-assets")
        .file(image)
        .param("blogPostId", blogPostId)
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.fileName").value(fileName))
      .andExpect(jsonPath("$.mimeType").value("image/jpeg"))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var optimizedPath = Path.of("target/test-uploads").resolve(JsonField.extract(response, "fileName"));
    assertImageLongestSideAtMost(optimizedPath, 1600);
    assertImageIsPortrait(optimizedPath);
  }

  @Test
  void ownerCanManageGalleryPhotosAndPublicOnlySeesPublishedPhotos() throws Exception {
    var session = login();
    var fileName = "gallery photo %d.png".formatted(System.nanoTime());
    var image = new MockMultipartFile("file", fileName, "image/png", new byte[] { 1, 2, 3 });

    var createResponse = mockMvc.perform(multipart("/api/admin/gallery-photos")
        .file(image)
        .param("title", "屋檐小太阳")
        .param("description", "仰头遇见一只小太阳。")
        .param("location", "生活图册")
        .param("takenAt", "2020")
        .param("sortOrder", "2")
        .param("status", "published")
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.title").value("屋檐小太阳"))
      .andExpect(jsonPath("$.status").value("published"))
      .andExpect(jsonPath("$.url").value("/uploads/gallery/" + fileName.replace(" ", "%20")))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var photoId = JsonField.extract(createResponse, "id");

    mockMvc.perform(get("/api/gallery-photos"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(1)))
      .andExpect(jsonPath("$.items[0].title").value("屋檐小太阳"));

    mockMvc.perform(put("/api/admin/gallery-photos/%s".formatted(photoId))
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "title": "屋檐小太阳（隐藏）",
            "description": "这张先不展示。",
            "location": "生活图册",
            "takenAt": "2020",
            "sortOrder": 1,
            "status": "hidden"
          }
          """))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.title").value("屋檐小太阳（隐藏）"))
      .andExpect(jsonPath("$.status").value("hidden"));

    mockMvc.perform(get("/api/gallery-photos"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(0)));

    mockMvc.perform(get("/api/admin/gallery-photos").session(session))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(1)))
      .andExpect(jsonPath("$.items[0].status").value("hidden"));

    mockMvc.perform(delete("/api/admin/gallery-photos/%s".formatted(photoId)).with(csrf()).session(session))
      .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/admin/gallery-photos").session(session))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(0)));
  }

  @Test
  void galleryUploadsAssignIncrementingSortOrderWhenSortOrderIsOmitted() throws Exception {
    var session = login();
    var firstFileName = "auto sort first %d.png".formatted(System.nanoTime());
    var secondFileName = "auto sort second %d.png".formatted(System.nanoTime());

    var firstResponse = mockMvc.perform(multipart("/api/admin/gallery-photos")
        .file(new MockMultipartFile("file", firstFileName, "image/png", new byte[] { 1, 2, 3 }))
        .param("title", "Auto sort first")
        .param("description", "First uploaded photo")
        .param("status", "published")
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andReturn()
      .getResponse()
      .getContentAsString();

    var firstPhotoId = JsonField.extract(firstResponse, "id");
    var firstSortOrder = JsonField.extractInt(firstResponse, "sortOrder");
    assertThat(firstSortOrder).isGreaterThan(0);

    var secondResponse = mockMvc.perform(multipart("/api/admin/gallery-photos")
        .file(new MockMultipartFile("file", secondFileName, "image/png", new byte[] { 4, 5, 6 }))
        .param("title", "Auto sort second")
        .param("description", "Second uploaded photo")
        .param("status", "published")
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andReturn()
      .getResponse()
      .getContentAsString();

    var secondPhotoId = JsonField.extract(secondResponse, "id");
    var secondSortOrder = JsonField.extractInt(secondResponse, "sortOrder");
    assertThat(secondSortOrder).isEqualTo(firstSortOrder + 1);

    mockMvc.perform(delete("/api/admin/gallery-photos/%s".formatted(firstPhotoId)).with(csrf()).session(session))
      .andExpect(status().isNoContent());

    mockMvc.perform(delete("/api/admin/gallery-photos/%s".formatted(secondPhotoId)).with(csrf()).session(session))
      .andExpect(status().isNoContent());
  }

  @Test
  void galleryUploadCreatesDerivativeImagesForListAndPreview() throws Exception {
    var session = login();
    var fileName = "large-gallery-%d.jpg".formatted(System.nanoTime());
    var baseName = fileName.substring(0, fileName.lastIndexOf('.'));
    var image = new MockMultipartFile("file", fileName, "image/jpeg", createJpegBytes(2200, 1400));

    var createResponse = mockMvc.perform(multipart("/api/admin/gallery-photos")
        .file(image)
        .param("title", "Large gallery photo")
        .param("description", "Should create responsive derivatives")
        .param("status", "published")
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.url").value("/uploads/gallery/" + fileName))
      .andExpect(jsonPath("$.thumbnailUrl").value("/uploads/gallery/" + baseName + "-thumbnail.jpg"))
      .andExpect(jsonPath("$.mediumUrl").value("/uploads/gallery/" + baseName + "-medium.jpg"))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var photoId = JsonField.extract(createResponse, "id");
    var originalPath = resolveUploadPath(JsonField.extract(createResponse, "url"));
    var thumbnailPath = resolveUploadPath(JsonField.extract(createResponse, "thumbnailUrl"));
    var mediumPath = resolveUploadPath(JsonField.extract(createResponse, "mediumUrl"));

    assertImageLongestSideAtMost(thumbnailPath, 640);
    assertImageLongestSideAtMost(mediumPath, 1600);
    assertThat(Files.size(thumbnailPath)).isLessThan(Files.size(originalPath));
    assertThat(Files.size(mediumPath)).isLessThan(Files.size(originalPath));

    mockMvc.perform(delete("/api/admin/gallery-photos/%s".formatted(photoId)).with(csrf()).session(session))
      .andExpect(status().isNoContent());
  }

  @Test
  void ownerCanChooseGalleryPhotosForHomeImageSlots() throws Exception {
    var session = login();
    var publishedFileName = "home hero %d.png".formatted(System.nanoTime());
    var hiddenFileName = "home hidden %d.png".formatted(System.nanoTime());

    var publishedPhotoResponse = mockMvc.perform(multipart("/api/admin/gallery-photos")
        .file(new MockMultipartFile("file", publishedFileName, "image/png", new byte[] { 1, 2, 3 }))
        .param("title", "Home hero")
        .param("description", "Hero floating card")
        .param("status", "published")
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andReturn()
      .getResponse()
      .getContentAsString();

    var hiddenPhotoResponse = mockMvc.perform(multipart("/api/admin/gallery-photos")
        .file(new MockMultipartFile("file", hiddenFileName, "image/png", new byte[] { 4, 5, 6 }))
        .param("title", "Hidden home photo")
        .param("description", "Should stay private")
        .param("status", "hidden")
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andReturn()
      .getResponse()
      .getContentAsString();

    var publishedPhotoId = JsonField.extract(publishedPhotoResponse, "id");
    var hiddenPhotoId = JsonField.extract(hiddenPhotoResponse, "id");

    mockMvc.perform(put("/api/admin/home-gallery-slots")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "slots": [
              {
                "slotKey": "hero-polaroid",
                "galleryPhotoId": "%s"
              },
              {
                "slotKey": "life-card",
                "galleryPhotoId": "%s"
              }
            ]
          }
          """.formatted(publishedPhotoId, hiddenPhotoId)))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(4)))
      .andExpect(jsonPath("$.items[0].slotKey").value("hero-polaroid"))
      .andExpect(jsonPath("$.items[0].photo.title").value("Home hero"))
      .andExpect(jsonPath("$.items[2].slotKey").value("life-card"))
      .andExpect(jsonPath("$.items[2].photo.title").value("Hidden home photo"));

    mockMvc.perform(get("/api/home-gallery-slots"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(4)))
      .andExpect(jsonPath("$.items[0].slotKey").value("hero-polaroid"))
      .andExpect(jsonPath("$.items[0].photo.title").value("Home hero"))
      .andExpect(jsonPath("$.items[2].slotKey").value("life-card"))
      .andExpect(jsonPath("$.items[2].photo", nullValue()));

    mockMvc.perform(delete("/api/admin/gallery-photos/%s".formatted(publishedPhotoId)).with(csrf()).session(session))
      .andExpect(status().isNoContent());

    mockMvc.perform(delete("/api/admin/gallery-photos/%s".formatted(hiddenPhotoId)).with(csrf()).session(session))
      .andExpect(status().isNoContent());
  }

  @Test
  void ownerCanUploadLocalImageForHomeImageSlot() throws Exception {
    var session = login();
    var fileName = "home-local-upload-%d.png".formatted(System.nanoTime());

    mockMvc.perform(multipart("/api/admin/home-gallery-slots/hero-polaroid/image")
        .file(new MockMultipartFile("file", fileName, "image/png", new byte[] { 1, 2, 3 }))
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.slotKey").value("hero-polaroid"))
      .andExpect(jsonPath("$.photo.title").value("首页顶部左侧拍立得"))
      .andExpect(jsonPath("$.photo.status").value("published"))
      .andExpect(jsonPath("$.photo.url").value("/uploads/home/" + fileName));

    mockMvc.perform(get("/api/home-gallery-slots"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(4)))
      .andExpect(jsonPath("$.items[0].slotKey").value("hero-polaroid"))
      .andExpect(jsonPath("$.items[0].photo.url").value("/uploads/home/" + fileName));
  }

  @Test
  void activeResumeVersionIsManagedFromAdminAndExposedPublicly() throws Exception {
    var session = login();
    var firstResumeName = "resume-first-%d.pdf".formatted(System.nanoTime());
    var secondResumeName = "resume-second-%d.pdf".formatted(System.nanoTime());
    var firstResume = new MockMultipartFile("file", firstResumeName, "application/pdf", new byte[] { 1, 2, 3 });
    var secondResume = new MockMultipartFile("file", secondResumeName, "application/pdf", new byte[] { 4, 5, 6 });

    mockMvc.perform(multipart("/api/admin/resume-versions")
        .file(firstResume)
        .with(csrf())
        .param("label", "Java 后端简历 v1")
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.label").value("Java 后端简历 v1"))
      .andExpect(jsonPath("$.active").value(true))
      .andExpect(jsonPath("$.url").value("/uploads/resumes/" + firstResumeName));

    var secondResponse = mockMvc.perform(multipart("/api/admin/resume-versions")
        .file(secondResume)
        .with(csrf())
        .param("label", "Java 后端简历 v2")
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.active").value(false))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var secondResumeId = JsonField.extract(secondResponse, "id");

    mockMvc.perform(get("/api/resume"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.label").value("Java 后端简历 v1"))
      .andExpect(jsonPath("$.url").value("/uploads/resumes/" + firstResumeName));

    mockMvc.perform(put("/api/admin/resume-versions/%s/activate".formatted(secondResumeId)).with(csrf()).session(session))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.label").value("Java 后端简历 v2"))
      .andExpect(jsonPath("$.active").value(true));

    mockMvc.perform(get("/api/resume"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.label").value("Java 后端简历 v2"))
      .andExpect(jsonPath("$.url").value("/uploads/resumes/" + secondResumeName));

    mockMvc.perform(get("/api/admin/resume-versions").session(session))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(2)))
      .andExpect(jsonPath("$.items[0].label").value("Java 后端简历 v2"));
  }

  @Test
  void ownerCanManageAboutContentAndExposeItPublicly() throws Exception {
    var session = login();

    mockMvc.perform(get("/api/about"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.profileDetails", hasSize(5)))
      .andExpect(jsonPath("$.resumeEntries", hasSize(3)));

    mockMvc.perform(put("/api/admin/about")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "portraitImageUrl": "/assets/profile.jpg",
            "wechatQrImageUrl": "/assets/wechat.png",
            "profileDetails": [
              {
                "label": "基本信息",
                "value": "林国娇 · 女 · 山东青岛",
                "icon": "user",
                "wide": true
              },
              {
                "label": "邮箱",
                "value": "you@example.com",
                "icon": "mail",
                "copyValue": "you@example.com",
                "wide": false
              }
            ],
            "resumeEntries": [
              {
                "category": "Project Resume",
                "title": "可编辑项目简历",
                "meta": "独立开发",
                "period": "2026.XX – 至今",
                "techStack": ["React", "Spring Boot"],
                "descriptionLabel": "项目描述",
                "description": "这段内容来自后台。",
                "highlightsLabel": "项目亮点",
                "highlights": [
                  {
                    "title": "后台可维护",
                    "detail": "支持新增、编辑、删除项目简历条目。"
                  }
                ],
                "sortOrder": 1
              }
            ],
            "contactHeading": "连接我的世界",
            "contactItems": [
              {
                "label": "Email Me",
                "value": "you@example.com",
                "icon": "mail"
              }
            ],
            "socialLinks": [
              {
                "label": "Github",
                "url": "https://github.com/GuojiaoLin?tab=repositories",
                "icon": "globe"
              }
            ]
          }
          """))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.profileDetails", hasSize(2)))
      .andExpect(jsonPath("$.resumeEntries", hasSize(1)))
      .andExpect(jsonPath("$.resumeEntries[0].title").value("可编辑项目简历"));

    mockMvc.perform(get("/api/about"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.portraitImageUrl").value("/assets/profile.jpg"))
      .andExpect(jsonPath("$.profileDetails[1].copyValue").value("you@example.com"))
      .andExpect(jsonPath("$.resumeEntries[0].description").value("这段内容来自后台。"))
      .andExpect(jsonPath("$.contactItems", hasSize(1)));
  }

  @Test
  void ownerCanUploadAboutImagesForProfileResources() throws Exception {
    var session = login();
    var fileName = "profile photo %d.png".formatted(System.nanoTime());
    var image = new MockMultipartFile("file", fileName, "image/png", new byte[] { 1, 2, 3 });

    mockMvc.perform(multipart("/api/admin/about/assets")
        .file(image)
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.fileName").value(fileName))
      .andExpect(jsonPath("$.mimeType").value("image/png"))
      .andExpect(jsonPath("$.sizeBytes").value(3))
      .andExpect(jsonPath("$.url").value("/uploads/about/" + fileName.replace(" ", "%20")));
  }

  @Test
  void aboutAssetUploadOptimizesLargeImages() throws Exception {
    var session = login();
    var fileName = "large about image %d.png".formatted(System.nanoTime());
    var baseName = fileName.substring(0, fileName.lastIndexOf('.'));
    var originalBytes = createPngBytes(1800, 1200);
    var image = new MockMultipartFile("file", fileName, "image/png", originalBytes);

    var response = mockMvc.perform(multipart("/api/admin/about/assets")
        .file(image)
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.fileName").value(baseName + ".jpg"))
      .andExpect(jsonPath("$.mimeType").value("image/jpeg"))
      .andExpect(jsonPath("$.url").value("/uploads/about/" + baseName.replace(" ", "%20") + ".jpg"))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var optimizedPath = Path.of("target/test-uploads/about").resolve(JsonField.extract(response, "fileName"));
    assertImageLongestSideAtMost(optimizedPath, 1600);
    assertThat(Files.size(optimizedPath)).isLessThan((long) originalBytes.length);
  }

  @Test
  void ownerCanUploadProjectCoverImages() throws Exception {
    var session = login();
    var fileName = "project cover %d.png".formatted(System.nanoTime());
    var image = new MockMultipartFile("file", fileName, "image/png", new byte[] { 1, 2, 3 });

    mockMvc.perform(multipart("/api/admin/projects/assets")
        .file(image)
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.fileName").value(fileName))
      .andExpect(jsonPath("$.mimeType").value("image/png"))
      .andExpect(jsonPath("$.sizeBytes").value(3))
      .andExpect(jsonPath("$.url").value("/uploads/projects/" + fileName.replace(" ", "%20")));
  }

  @Test
  void projectCoverUploadOptimizesLargeImages() throws Exception {
    var session = login();
    var fileName = "large project cover %d.png".formatted(System.nanoTime());
    var baseName = fileName.substring(0, fileName.lastIndexOf('.'));
    var originalBytes = createPngBytes(1800, 1200);
    var image = new MockMultipartFile("file", fileName, "image/png", originalBytes);

    var response = mockMvc.perform(multipart("/api/admin/projects/assets")
        .file(image)
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.fileName").value(baseName + ".png"))
      .andExpect(jsonPath("$.mimeType").value("image/png"))
      .andExpect(jsonPath("$.url").value("/uploads/projects/" + baseName.replace(" ", "%20") + ".png"))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var optimizedPath = Path.of("target/test-uploads/projects").resolve(JsonField.extract(response, "fileName"));
    assertImageLongestSideAtMost(optimizedPath, 1600);
    assertThat(Files.size(optimizedPath)).isLessThan((long) originalBytes.length);
  }

  @Test
  void projectCoverUploadProcessesGeneratedLogoImage() throws Exception {
    var session = login();
    var fileName = "generated logo %d.png".formatted(System.nanoTime());
    var image = new MockMultipartFile(
      "file",
      fileName,
      "image/png",
      Files.readAllBytes(Path.of("..", "design", "logo.png"))
    );

    var response = mockMvc.perform(multipart("/api/admin/projects/assets")
        .file(image)
        .with(csrf())
        .session(session))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.fileName").value(fileName))
      .andExpect(jsonPath("$.mimeType").value("image/png"))
      .andExpect(jsonPath("$.url").value("/uploads/projects/" + fileName.replace(" ", "%20")))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var processedPath = Path.of("target/test-uploads/projects").resolve(JsonField.extract(response, "fileName"));
    var logo = ImageIO.read(processedPath.toFile());
    assertThat(logo.getRGB(0, 0) & 0xffffff).isEqualTo(0xffff00);
    logo.flush();
  }

  @Test
  void homeFeaturedBlogPostsAreManagedFromAdminFields() throws Exception {
    var session = login();
    var projectId = createPublishedProject(session, "home-featured-project-" + System.nanoTime());

    createBlogPost(session, projectId, "home-featured-second", "Second card", "published", true, 2);
    createBlogPost(session, projectId, "home-featured-first", "First card", "published", true, 1);
    createBlogPost(session, projectId, "home-featured-third", "Third card", "published", true, 3);
    createBlogPost(session, projectId, "home-featured-fourth", "Fourth card", "published", true, 4);
    createBlogPost(session, projectId, "home-featured-hidden", "Hidden card", "hidden", true, 0);
    createBlogPost(session, projectId, "home-featured-off", "Off card", "published", false, 0);

    mockMvc.perform(get("/api/blog-posts/home-featured"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(3)))
      .andExpect(jsonPath("$.items[0].title").value("First card"))
      .andExpect(jsonPath("$.items[0].featuredOnHome").value(true))
      .andExpect(jsonPath("$.items[0].homeOrder").value(1))
      .andExpect(jsonPath("$.items[1].title").value("Second card"))
      .andExpect(jsonPath("$.items[2].title").value("Third card"));
  }

  @Test
  void blogPostSlugCanRepeatAcrossDifferentProjects() throws Exception {
    var session = login();
    var projectOneSlug = "scoped-slug-one-" + System.nanoTime();
    var projectTwoSlug = "scoped-slug-two-" + System.nanoTime();
    var projectOneId = createPublishedProject(session, projectOneSlug);
    var projectTwoId = createPublishedProject(session, projectTwoSlug);

    createBlogPost(session, projectOneId, "blog-1", "Project one blog", "published", false, 1);
    createBlogPost(session, projectTwoId, "blog-1", "Project two blog", "published", false, 1);

    mockMvc.perform(get("/api/projects/%s/blog-posts/blog-1".formatted(projectOneSlug)))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.projectSlug").value(projectOneSlug))
      .andExpect(jsonPath("$.title").value("Project one blog"));

    mockMvc.perform(get("/api/projects/%s/blog-posts/blog-1".formatted(projectTwoSlug)))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.projectSlug").value(projectTwoSlug))
      .andExpect(jsonPath("$.title").value("Project two blog"));
  }

  @Test
  void publicCommentsStayPendingUntilOwnerApprovesThem() throws Exception {
    var session = login();
    var projectId = createPublishedProject(session);
    var blogPostId = createPublishedBlogPost(session, projectId);

    var commentResponse = mockMvc.perform(post("/api/comments")
        .contentType("application/json")
        .content("""
          {
            "targetType": "blog",
            "targetId": "%s",
            "authorName": "读者",
            "content": "这篇讲得很清楚。"
          }
          """.formatted(blogPostId)))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.status").value("pending"))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var commentId = JsonField.extract(commentResponse, "id");

    mockMvc.perform(get("/api/blog-posts/blog-one/comments"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(0)));

    mockMvc.perform(put("/api/admin/comments/%s/approve".formatted(commentId)).with(csrf()).session(session))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value("approved"));

    mockMvc.perform(get("/api/blog-posts/blog-one/comments"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(1)))
      .andExpect(jsonPath("$.items[0].content").value("这篇讲得很清楚。"));

    mockMvc.perform(delete("/api/admin/comments/%s".formatted(commentId)).with(csrf()).session(session))
      .andExpect(status().isNoContent());
  }

  @Test
  void ownerBlogCommentsAreApprovedImmediately() throws Exception {
    var session = login();
    var projectId = createPublishedProject(session, "owner-comment-project-" + System.nanoTime());
    var blogPostId = createPublishedBlogPost(session, projectId, "owner-comment-post", "Owner comment post");

    mockMvc.perform(post("/api/comments")
        .session(session)
        .contentType("application/json")
        .content("""
          {
            "targetType": "blog",
            "targetId": "%s",
            "authorName": "LGj",
            "content": "Owner note"
          }
          """.formatted(blogPostId)))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.status").value("approved"));

    mockMvc.perform(get("/api/blog-posts/owner-comment-post/comments"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(1)))
      .andExpect(jsonPath("$.items[0].content").value("Owner note"));
  }

  @Test
  void publicGuestbookCommentsStayPendingUntilOwnerApprovesThem() throws Exception {
    var session = login();

    var commentResponse = mockMvc.perform(post("/api/comments")
        .contentType("application/json")
        .content("""
          {
            "targetType": "guestbook",
            "authorName": "Visitor",
            "content": "Hello guestbook"
          }
          """))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.status").value("pending"))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var commentId = JsonField.extract(commentResponse, "id");

    mockMvc.perform(get("/api/comments/guestbook"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(0)));

    mockMvc.perform(put("/api/admin/comments/%s/approve".formatted(commentId)).with(csrf()).session(session))
      .andExpect(status().isOk());

    var replyResponse = mockMvc.perform(post("/api/comments")
        .contentType("application/json")
        .content("""
          {
            "targetType": "guestbook",
            "parentId": "%s",
            "authorName": "LGj",
            "content": "Thanks for visiting"
          }
          """.formatted(commentId)))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.status").value("pending"))
      .andReturn()
      .getResponse()
      .getContentAsString();

    var replyId = JsonField.extract(replyResponse, "id");

    mockMvc.perform(put("/api/admin/comments/%s/approve".formatted(replyId)).with(csrf()).session(session))
      .andExpect(status().isOk());

    mockMvc.perform(get("/api/comments/guestbook"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(1)))
      .andExpect(jsonPath("$.items[0].content").value("Hello guestbook"))
      .andExpect(jsonPath("$.items[0].replies", hasSize(1)))
      .andExpect(jsonPath("$.items[0].replies[0].content").value("Thanks for visiting"));
  }

  private MockHttpSession login() throws Exception {
    var session = new MockHttpSession();
    mockMvc.perform(post("/api/auth/login")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "email": "owner@example.com",
            "password": "correct-password"
          }
          """))
      .andExpect(status().isOk());
    return session;
  }

  private String createPublishedProject(MockHttpSession session) throws Exception {
    var response = mockMvc.perform(post("/api/admin/projects")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "title": "项目一",
            "slug": "project-one",
            "summary": "摘要",
            "descriptionMarkdown": "正文",
            "techStack": ["React"],
            "status": "published"
          }
          """))
      .andExpect(status().isCreated())
      .andReturn()
      .getResponse()
      .getContentAsString();

    return JsonField.extract(response, "id");
  }

  private String createPublishedProject(MockHttpSession session, String slug) throws Exception {
    var response = mockMvc.perform(post("/api/admin/projects")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "title": "Media project",
            "slug": "%s",
            "summary": "Summary",
            "descriptionMarkdown": "Body",
            "techStack": ["React"],
            "status": "published"
          }
          """.formatted(slug)))
      .andExpect(status().isCreated())
      .andReturn()
      .getResponse()
      .getContentAsString();

    return JsonField.extract(response, "id");
  }

  private String createPublishedBlogPost(MockHttpSession session, String projectId) throws Exception {
    var response = mockMvc.perform(post("/api/admin/blog-posts")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "projectId": "%s",
            "title": "博客一",
            "slug": "blog-one",
            "category": "架构",
            "summary": "摘要",
            "contentMarkdown": "正文",
            "blogOrder": 1,
            "status": "published"
          }
          """.formatted(projectId)))
      .andExpect(status().isCreated())
      .andReturn()
      .getResponse()
      .getContentAsString();

    return JsonField.extract(response, "id");
  }

  private String createPublishedBlogPost(
    MockHttpSession session,
    String projectId,
    String slug,
    String title
  ) throws Exception {
    var response = mockMvc.perform(post("/api/admin/blog-posts")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "projectId": "%s",
            "title": "%s",
            "slug": "%s",
            "category": "Architecture",
            "summary": "Summary",
            "contentMarkdown": "Body",
            "blogOrder": 1,
            "status": "published"
          }
          """.formatted(projectId, title, slug)))
      .andExpect(status().isCreated())
      .andReturn()
      .getResponse()
      .getContentAsString();

    return JsonField.extract(response, "id");
  }

  private String createBlogPost(
    MockHttpSession session,
    String projectId,
    String slug,
    String title,
    String status,
    boolean featuredOnHome,
    int homeOrder
  ) throws Exception {
    var response = mockMvc.perform(post("/api/admin/blog-posts")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "projectId": "%s",
            "title": "%s",
            "slug": "%s",
            "category": "Home",
            "summary": "Summary",
            "contentMarkdown": "Body",
            "blogOrder": 1,
            "featuredOnHome": %s,
            "homeOrder": %d,
            "status": "%s"
          }
          """.formatted(projectId, title, slug, featuredOnHome, homeOrder, status)))
      .andExpect(status().isCreated())
      .andReturn()
      .getResponse()
      .getContentAsString();

    return JsonField.extract(response, "id");
  }

  private byte[] createJpegBytes(int width, int height) throws Exception {
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
    return output.toByteArray();
  }

  private byte[] createPngBytes(int width, int height) throws Exception {
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
    ImageIO.write(image, "png", output);
    return output.toByteArray();
  }

  private Path resolveUploadPath(String url) {
    assertThat(url).startsWith("/uploads/");
    return Path.of("target/test-uploads").resolve(url.substring("/uploads/".length()));
  }

  private void assertImageLongestSideAtMost(Path path, int maxSide) throws Exception {
    assertThat(Files.exists(path)).isTrue();
    var image = ImageIO.read(path.toFile());
    assertThat(image).isNotNull();
    assertThat(Math.max(image.getWidth(), image.getHeight())).isLessThanOrEqualTo(maxSide);
  }

  private void assertImageIsPortrait(Path path) throws Exception {
    assertThat(Files.exists(path)).isTrue();
    var image = ImageIO.read(path.toFile());
    assertThat(image).isNotNull();
    assertThat(image.getHeight()).isGreaterThan(image.getWidth());
  }

  private static final class JsonField {
    private static String extract(String json, String fieldName) {
      var marker = "\"%s\":\"".formatted(fieldName);
      var start = json.indexOf(marker);
      if (start < 0) {
        throw new IllegalArgumentException("Missing JSON field: " + fieldName);
      }
      var valueStart = start + marker.length();
      var valueEnd = json.indexOf('"', valueStart);
      return json.substring(valueStart, valueEnd);
    }

    private static int extractInt(String json, String fieldName) {
      var marker = "\"%s\":".formatted(fieldName);
      var start = json.indexOf(marker);
      if (start < 0) {
        throw new IllegalArgumentException("Missing JSON field: " + fieldName);
      }

      var valueStart = start + marker.length();
      var valueEnd = valueStart;
      while (valueEnd < json.length() && Character.isDigit(json.charAt(valueEnd))) {
        valueEnd += 1;
      }

      return Integer.parseInt(json.substring(valueStart, valueEnd));
    }
  }
}
