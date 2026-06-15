package com.guojiaolin.website.health;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  @GetMapping("/api/health")
  public Map<String, Boolean> health() {
    return Map.of("ok", true);
  }
}
