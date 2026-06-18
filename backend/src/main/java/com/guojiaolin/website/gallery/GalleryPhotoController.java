package com.guojiaolin.website.gallery;

import com.guojiaolin.website.common.ListResponse;
import com.guojiaolin.website.content.ContentStatus;
import com.guojiaolin.website.gallery.dto.GalleryPhotoRequest;
import com.guojiaolin.website.gallery.dto.GalleryPhotoResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class GalleryPhotoController {

  private final GalleryPhotoService galleryPhotos;

  public GalleryPhotoController(GalleryPhotoService galleryPhotos) {
    this.galleryPhotos = galleryPhotos;
  }

  @GetMapping("/api/gallery-photos")
  public ListResponse<GalleryPhotoResponse> listPublished() {
    return new ListResponse<>(galleryPhotos.listPublished());
  }

  @GetMapping("/api/admin/gallery-photos")
  public ListResponse<GalleryPhotoResponse> listAdmin() {
    return new ListResponse<>(galleryPhotos.listAdmin());
  }

  @PostMapping(value = "/api/admin/gallery-photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<GalleryPhotoResponse> upload(
    @RequestParam("file") MultipartFile file,
    @RequestParam("title") String title,
    @RequestParam(value = "description", required = false) String description,
    @RequestParam(value = "location", required = false) String location,
    @RequestParam(value = "takenAt", required = false) String takenAt,
    @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
    @RequestParam(value = "status", required = false) String status
  ) {
    var request = new GalleryPhotoRequest(title, description, location, takenAt, sortOrder, parseStatus(status));
    return ResponseEntity.status(201).body(galleryPhotos.upload(file, request));
  }

  @PutMapping("/api/admin/gallery-photos/{id}")
  public GalleryPhotoResponse update(@PathVariable UUID id, @Valid @RequestBody GalleryPhotoRequest request) {
    return galleryPhotos.update(id, request);
  }

  @PostMapping(value = "/api/admin/gallery-photos/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public GalleryPhotoResponse replaceImage(@PathVariable UUID id, @RequestParam("file") MultipartFile file) {
    return galleryPhotos.replaceImage(id, file);
  }

  @DeleteMapping("/api/admin/gallery-photos/{id}")
  public ResponseEntity<Void> delete(@PathVariable UUID id) {
    galleryPhotos.delete(id);
    return ResponseEntity.noContent().build();
  }

  private ContentStatus parseStatus(String value) {
    return value == null || value.isBlank() ? null : ContentStatus.fromJson(value);
  }
}
