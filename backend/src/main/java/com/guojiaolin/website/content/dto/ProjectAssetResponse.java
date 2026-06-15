package com.guojiaolin.website.content.dto;

public record ProjectAssetResponse(
  String url,
  String fileName,
  String mimeType,
  long sizeBytes
) {
}
