package com.guojiaolin.website;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.guojiaolin.website.admin.AdminUserRepository;
import com.guojiaolin.website.admin.AdminUserSeeder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private AdminUserRepository adminUsers;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Test
  void adminEndpointsRequireLoginAndLoginCreatesSession() throws Exception {
    mockMvc.perform(get("/api/admin/projects"))
      .andExpect(status().isUnauthorized());

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
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "email": "owner@example.com",
            "password": "wrong-password"
          }
          """))
      .andExpect(status().isUnauthorized());
  }

  @Test
  @DirtiesContext
  void changePasswordRequiresCurrentPasswordAndUpdatesLoginCredentials() throws Exception {
    var session = login("owner@example.com", "correct-password");

    mockMvc.perform(put("/api/auth/password")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "currentPassword": "correct-password",
            "newPassword": "safe66"
          }
          """))
      .andExpect(status().isNoContent());

    mockMvc.perform(post("/api/auth/login")
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "email": "owner@example.com",
            "password": "correct-password"
          }
          """))
      .andExpect(status().isUnauthorized());

    mockMvc.perform(post("/api/auth/login")
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "email": "owner@example.com",
            "password": "safe66"
          }
          """))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.email").value("owner@example.com"));
  }

  @Test
  void changePasswordRejectsWrongCurrentPassword() throws Exception {
    var session = login("owner@example.com", "correct-password");

    mockMvc.perform(put("/api/auth/password")
        .session(session)
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "currentPassword": "wrong-password",
            "newPassword": "new-owner-password-safe"
          }
          """))
      .andExpect(status().isUnauthorized());
  }

  @Test
  @DirtiesContext
  void adminSeederOnlyCreatesInitialOwnerWhenNoAdminExists() throws Exception {
    new AdminUserSeeder(
      adminUsers,
      passwordEncoder,
      "second-owner@example.com",
      "second-owner-password"
    ).run(null);

    org.assertj.core.api.Assertions.assertThat(adminUsers.count()).isEqualTo(1);
    org.assertj.core.api.Assertions.assertThat(adminUsers.findByEmailIgnoreCase("second-owner@example.com")).isEmpty();
  }

  private MockHttpSession login(String email, String password) throws Exception {
    return (MockHttpSession) mockMvc.perform(post("/api/auth/login")
        .with(csrf())
        .contentType("application/json")
        .content("""
          {
            "email": "%s",
            "password": "%s"
          }
          """.formatted(email, password)))
      .andExpect(status().isOk())
      .andReturn()
      .getRequest()
      .getSession(false);
  }
}
