package com.guojiaolin.website.content;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CommentTargetType {
  BLOG("blog"),
  GUESTBOOK("guestbook");

  private final String value;

  CommentTargetType(String value) {
    this.value = value;
  }

  @JsonCreator
  public static CommentTargetType fromJson(String value) {
    for (var type : values()) {
      if (type.value.equalsIgnoreCase(value) || type.name().equalsIgnoreCase(value)) {
        return type;
      }
    }
    throw new IllegalArgumentException("Unsupported comment target type: " + value);
  }

  @JsonValue
  public String getValue() {
    return value;
  }
}
