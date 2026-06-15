package com.guojiaolin.website.content;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class JsonListMapper {

  private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
  };

  private final ObjectMapper objectMapper;

  public JsonListMapper(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public String toJson(List<String> values) {
    try {
      return objectMapper.writeValueAsString(values == null ? List.of() : values);
    } catch (JsonProcessingException error) {
      throw new IllegalArgumentException("Cannot serialize list value.", error);
    }
  }

  public List<String> fromJson(String json) {
    if (json == null || json.isBlank()) {
      return List.of();
    }

    try {
      return objectMapper.readValue(json, STRING_LIST);
    } catch (JsonProcessingException error) {
      return List.of();
    }
  }
}
