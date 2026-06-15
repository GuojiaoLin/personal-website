package com.guojiaolin.website.security;

import com.guojiaolin.website.admin.AdminUserRepository;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AdminUserDetailsService implements UserDetailsService {

  private final AdminUserRepository users;

  public AdminUserDetailsService(AdminUserRepository users) {
    this.users = users;
  }

  @Override
  public UserDetails loadUserByUsername(String username) {
    var user = users.findByEmailIgnoreCase(username)
      .orElseThrow(() -> new UsernameNotFoundException("Admin user not found."));

    return new User(
      user.getEmail(),
      user.getPasswordHash(),
      List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
    );
  }
}
