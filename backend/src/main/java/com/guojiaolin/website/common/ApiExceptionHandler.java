package com.guojiaolin.website.common;

import jakarta.validation.ConstraintViolationException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(BadRequestException.class)
  ResponseEntity<Map<String, String>> handleBadRequest(BadRequestException error) {
    return error(HttpStatus.BAD_REQUEST, error.getMessage());
  }

  @ExceptionHandler(NotFoundException.class)
  ResponseEntity<Map<String, String>> handleNotFound(NotFoundException error) {
    return error(HttpStatus.NOT_FOUND, error.getMessage());
  }

  @ExceptionHandler(BadCredentialsException.class)
  ResponseEntity<Map<String, String>> handleBadCredentials() {
    return error(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
  }

  @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class})
  ResponseEntity<Map<String, String>> handleValidation() {
    return error(HttpStatus.BAD_REQUEST, "Request validation failed.");
  }

  private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(Map.of("error", message));
  }
}
