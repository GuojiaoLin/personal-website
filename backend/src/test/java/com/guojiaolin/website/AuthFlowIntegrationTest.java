package com.guojiaolin.website;

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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void adminEndpointsRequireLoginAndLoginCreatesSession() throws Exception {
    mockMvc.perform(get("/api/admin/projects"))
      .andExpect(status().isUnauthorized());

    var session = new MockHttpSession();

    mockMvc.perform(post("/api/auth/login")
        .session(session)
        .contentType("application/json")
        .content("""
          {
            "email": "owner@example.com",
            "password": "correct-password"
          }
          """))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.email").value("owner@example.com"))
      .andExpect(jsonPath("$.role").value("OWNER"));

    mockMvc.perform(get("/api/auth/me").session(session))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.email").value("owner@example.com"));

    mockMvc.perform(get("/api/admin/projects").session(session))
      .andExpect(status().isOk());
  }

  @Test
  void loginRejectsWrongPassword() throws Exception {
    mockMvc.perform(post("/api/auth/login")
        .contentType("application/json")
        .content("""
          {
            "email": "owner@example.com",
            "password": "wrong-password"
          }
          """))
      .andExpect(status().isUnauthorized());
  }
}
