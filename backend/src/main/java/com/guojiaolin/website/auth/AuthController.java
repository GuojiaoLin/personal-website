package com.guojiaolin.website.auth;

import com.guojiaolin.website.admin.AdminUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final AdminUserRepository users;

  public AuthController(AuthenticationManager authenticationManager, AdminUserRepository users) {
    this.authenticationManager = authenticationManager;
    this.users = users;
  }

  @PostMapping("/login")
  public AdminUserResponse login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest servletRequest) {
    var authentication = authenticationManager.authenticate(
      new UsernamePasswordAuthenticationToken(request.email(), request.password())
    );

    SecurityContextHolder.getContext().setAuthentication(authentication);
    servletRequest.getSession(true).setAttribute(
      HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
      SecurityContextHolder.getContext()
    );

    return currentUser(authentication);
  }

  @GetMapping("/me")
  public ResponseEntity<AdminUserResponse> me(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
      return ResponseEntity.status(401).build();
    }

    return ResponseEntity.ok(currentUser(authentication));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      HttpServletRequest request,
      HttpServletResponse response,
      Authentication authentication) {
    new SecurityContextLogoutHandler().logout(request, response, authentication);
    return ResponseEntity.noContent().build();
  }

  private AdminUserResponse currentUser(Authentication authentication) {
    var user = users.findByEmailIgnoreCase(authentication.getName())
      .orElseThrow(() -> new IllegalStateException("Authenticated admin user is missing."));

    return new AdminUserResponse(user.getEmail(), user.getRole().name());
  }

  public record LoginRequest(
    @NotBlank @Email String email,
    @NotBlank String password
  ) {
  }

  public record AdminUserResponse(String email, String role) {
  }
}
