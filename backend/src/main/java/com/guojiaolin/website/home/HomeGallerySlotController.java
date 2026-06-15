package com.guojiaolin.website.home;

import com.guojiaolin.website.common.ListResponse;
import com.guojiaolin.website.home.dto.HomeGallerySlotRequest;
import com.guojiaolin.website.home.dto.HomeGallerySlotResponse;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class HomeGallerySlotController {

  private final HomeGallerySlotService homeGallerySlots;

  public HomeGallerySlotController(HomeGallerySlotService homeGallerySlots) {
    this.homeGallerySlots = homeGallerySlots;
  }

  @GetMapping("/api/home-gallery-slots")
  public ListResponse<HomeGallerySlotResponse> listPublic() {
    return new ListResponse<>(homeGallerySlots.listPublic());
  }

  @GetMapping("/api/admin/home-gallery-slots")
  public ListResponse<HomeGallerySlotResponse> listAdmin() {
    return new ListResponse<>(homeGallerySlots.listAdmin());
  }

  @PutMapping("/api/admin/home-gallery-slots")
  public ListResponse<HomeGallerySlotResponse> update(@Valid @RequestBody HomeGallerySlotRequest request) {
    return new ListResponse<>(homeGallerySlots.update(request));
  }

  @PostMapping(value = "/api/admin/home-gallery-slots/{slotKey}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<HomeGallerySlotResponse> uploadImage(
    @PathVariable String slotKey,
    @RequestParam("file") MultipartFile file
  ) {
    return ResponseEntity.status(201).body(homeGallerySlots.uploadImage(slotKey, file));
  }
}
