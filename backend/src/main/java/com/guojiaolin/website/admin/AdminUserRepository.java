package com.guojiaolin.website.admin;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminUserRepository extends JpaRepository<AdminUser, UUID> {

  Optional<AdminUser> findByEmailIgnoreCase(String email);
}
