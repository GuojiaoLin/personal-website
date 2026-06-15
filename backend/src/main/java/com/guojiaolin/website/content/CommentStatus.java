package com.guojiaolin.website.content;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CommentStatus {
  PENDING("pending"),
  APPROVED("approved"),
  HIDDEN("hidden");

  private final String value;

  CommentStatus(String value) {
    this.value = value;
  }

  @JsonCreator
  public static CommentStatus fromJson(String value) {
    for (var status : values()) {
      if (status.value.equalsIgnoreCase(value) || status.name().equalsIgnoreCase(value)) {
        return status;
      }
    }
    throw new IllegalArgumentException("Unsupported comment status: " + value);
  }

  @JsonValue
  public String getValue() {
    return value;
  }
}
