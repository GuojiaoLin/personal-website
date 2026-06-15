package com.guojiaolin.website.admin;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
public class AdminUserSeeder implements ApplicationRunner {

  private final AdminUserRepository users;
  private final PasswordEncoder passwordEncoder;
  private final String email;
  private final String password;

  public AdminUserSeeder(
      AdminUserRepository users,
      PasswordEncoder passwordEncoder,
      @Value("${site.admin.email:}") String email,
      @Value("${site.admin.password:}") String password) {
    this.users = users;
    this.passwordEncoder = passwordEncoder;
    this.email = email;
    this.password = password;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
      return;
    }

    users.findByEmailIgnoreCase(email).orElseGet(() -> {
      var user = new AdminUser();
      user.setEmail(email.trim().toLowerCase());
      user.setPasswordHash(passwordEncoder.encode(password));
      user.setRole(AdminRole.OWNER);
      return users.save(user);
    });
  }
}
