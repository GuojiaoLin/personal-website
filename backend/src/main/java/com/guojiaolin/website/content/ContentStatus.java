package com.guojiaolin.website.content;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ContentStatus {
  DRAFT("draft"),
  PUBLISHED("published"),
  HIDDEN("hidden");

  private final String value;

  ContentStatus(String value) {
    this.value = value;
  }

  @JsonCreator
  public static ContentStatus fromJson(String value) {
    for (var status : values()) {
      if (status.value.equalsIgnoreCase(value) || status.name().equalsIgnoreCase(value)) {
        return status;
      }
    }
    throw new IllegalArgumentException("Unsupported content status: " + value);
  }

  @JsonValue
  public String getValue() {
    return value;
  }
}
