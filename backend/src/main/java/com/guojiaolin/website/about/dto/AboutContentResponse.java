package com.guojiaolin.website.about.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AboutContentResponse(
  UUID id,
  String portraitImageUrl,
  String wechatQrImageUrl,
  List<AboutProfileDetail> profileDetails,
  List<AboutResumeEntry> resumeEntries,
  String contactHeading,
  List<AboutContactItem> contactItems,
  List<AboutSocialLink> socialLinks,
  Instant createdAt,
  Instant updatedAt
) {
}
