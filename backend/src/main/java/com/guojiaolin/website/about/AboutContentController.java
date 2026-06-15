package com.guojiaolin.website.about;

import com.guojiaolin.website.about.dto.AboutAssetResponse;
import com.guojiaolin.website.about.dto.AboutContentRequest;
import com.guojiaolin.website.about.dto.AboutContentResponse;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class AboutContentController {

  private final AboutContentService aboutContent;
  private final AboutAssetService aboutAssets;

  public AboutContentController(AboutContentService aboutContent, AboutAssetService aboutAssets) {
    this.aboutContent = aboutContent;
    this.aboutAssets = aboutAssets;
  }

  @GetMapping("/api/about")
  public AboutContentResponse getPublic() {
    return aboutContent.get();
  }

  @GetMapping("/api/admin/about")
  public AboutContentResponse getAdmin() {
    return aboutContent.get();
  }

  @PutMapping("/api/admin/about")
  public AboutContentResponse update(@Valid @RequestBody AboutContentRequest request) {
    return aboutContent.update(request);
  }

  @PostMapping(value = "/api/admin/about/assets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<AboutAssetResponse> uploadAsset(@RequestParam("file") MultipartFile file) {
    return ResponseEntity.status(201).body(aboutAssets.upload(file));
  }
}
