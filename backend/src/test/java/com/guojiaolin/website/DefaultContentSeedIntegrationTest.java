package com.guojiaolin.website;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
  "site.content.seed.enabled=true",
  "site.content.seed.blog-directory=src/test/resources/blog-seed-source"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DefaultContentSeedIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void defaultFrontendContentIsSeededIntoDatabaseAndVisibleInAdmin() throws Exception {
    var session = login();

    mockMvc.perform(get("/api/projects"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(2)))
      .andExpect(jsonPath("$.items[0].slug").value("momozhi"))
      .andExpect(jsonPath("$.items[1].slug").value("mmcsa"));

    mockMvc.perform(get("/api/blog-posts"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(1)))
      .andExpect(jsonPath("$.items[0].projectSlug").value("mmcsa"))
      .andExpect(jsonPath("$.items[0].slug").value("mmcsa/2026-06-09-seed-check"))
      .andExpect(jsonPath("$.items[0].title").value("默认内容导入检查"))
      .andExpect(jsonPath("$.items[0].contentMarkdown").value("## 正文\n\n这段内容应该由后端默认内容导入器写进数据库，并在后台内容管理里可见。"));

    mockMvc.perform(get("/api/admin/projects").session(session))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(2)));

    mockMvc.perform(get("/api/admin/blog-posts").session(session))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items", hasSize(1)))
      .andExpect(jsonPath("$.items[0].summary").value("这篇测试文章用于确认前台 Markdown 内容能写入后台数据库。"));
  }

  private MockHttpSession login() throws Exception {
    return (MockHttpSession) mockMvc.perform(post("/api/auth/login")
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "email": "owner@example.com",
            "password": "correct-password"
          }
          """))
      .andExpect(status().isOk())
      .andReturn()
      .getRequest()
      .getSession(false);
  }
}
