package com.guojiaolin.website.resume;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ResumeVersionRepository extends JpaRepository<ResumeVersion, UUID> {

  List<ResumeVersion> findAllByActiveTrue();

  Optional<ResumeVersion> findFirstByActiveTrueOrderByUpdatedAtDesc();

  @Modifying
  @Query("update ResumeVersion version set version.active = false where version.active = true")
  void deactivateAll();
}
