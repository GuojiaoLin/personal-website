package com.guojiaolin.website.about.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record AboutContentRequest(
  String portraitImageUrl,
  String wechatQrImageUrl,
  @Valid List<AboutProfileDetail> profileDetails,
  @Valid List<AboutResumeEntry> resumeEntries,
  @NotBlank String contactHeading,
  @Valid List<AboutContactItem> contactItems,
  @Valid List<AboutSocialLink> socialLinks
) {
}
