package com.guojiaolin.website.media.dto;

import com.guojiaolin.website.media.MediaAsset;
import java.time.Instant;
import java.util.UUID;

public record MediaAssetResponse(
  UUID id,
  String url,
  String fileName,
  String mimeType,
  long sizeBytes,
  UUID blogPostId,
  Instant createdAt
) {

  public static MediaAssetResponse from(MediaAsset asset) {
    return new MediaAssetResponse(
      asset.getId(),
      asset.getUrl(),
      asset.getFileName(),
      asset.getMimeType(),
      asset.getSizeBytes(),
      asset.getBlogPost() == null ? null : asset.getBlogPost().getId(),
      asset.getCreatedAt()
    );
  }
}
