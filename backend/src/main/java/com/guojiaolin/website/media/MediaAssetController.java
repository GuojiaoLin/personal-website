package com.guojiaolin.website.media;

import com.guojiaolin.website.common.ListResponse;
import com.guojiaolin.website.media.dto.MediaAssetResponse;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/media-assets")
public class MediaAssetController {

  private final MediaAssetService mediaAssets;

  public MediaAssetController(MediaAssetService mediaAssets) {
    this.mediaAssets = mediaAssets;
  }

  @GetMapping
  public ListResponse<MediaAssetResponse> list(@RequestParam(value = "blogPostId", required = false) UUID blogPostId) {
    return new ListResponse<>(mediaAssets.list(blogPostId));
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<MediaAssetResponse> upload(
    @RequestParam("file") MultipartFile file,
    @RequestParam("blogPostId") UUID blogPostId
  ) {
    return ResponseEntity.status(201).body(mediaAssets.upload(file, blogPostId));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable UUID id) {
    mediaAssets.delete(id);
    return ResponseEntity.noContent().build();
  }
}
