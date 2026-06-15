package com.guojiaolin.website.about.dto;

public record AboutAssetResponse(
  String url,
  String fileName,
  String mimeType,
  long sizeBytes
) {
}
