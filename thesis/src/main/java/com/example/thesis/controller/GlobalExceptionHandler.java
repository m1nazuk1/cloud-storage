package com.example.thesis.controller;

import com.example.thesis.exception.ResourceConflictException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.BAD_REQUEST;
        }
        String reason = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
        Map<String, Object> body = new HashMap<>();
        body.put("error", status.getReasonPhrase());
        body.put("message", reason);
        body.put("status", status.value());
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Конфликт данных");
        error.put("message", "Запись уже существует или нарушены ограничения базы данных");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> handleDataAccess(DataAccessException ex) {
        log.error("Database access error", ex);
        Map<String, String> error = new HashMap<>();
        error.put("error", "База данных");
        error.put("message", "Не удалось выполнить операцию. Повторите попытку позже.");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(ConstraintViolationException ex) {
        String msg = ex.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.joining("; "));
        Map<String, String> error = new HashMap<>();
        error.put("error", "Ошибка валидации");
        error.put("message", msg);
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.warn("Parameter type mismatch: {} = {}", ex.getName(), ex.getValue());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Неверный параметр");
        error.put("message", "Некорректное значение в адресе запроса");
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(ResourceConflictException.class)
    public ResponseEntity<Map<String, Object>> handleResourceConflict(ResourceConflictException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Conflict");
        body.put("message", ex.getMessage());
        body.put("status", HttpStatus.CONFLICT.value());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, Object>> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        log.warn("Optimistic lock: {}", ex.getMessage());
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Conflict");
        body.put("message", "Версия записи устарела. Обновите список файлов и повторите действие.");
        body.put("status", HttpStatus.CONFLICT.value());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxSizeException(MaxUploadSizeExceededException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Файл слишком большой");
        error.put("message", "Размер файла превышает допустимый лимит");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Доступ запрещён");
        error.put("message", "Недостаточно прав для этого действия");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentialsException(BadCredentialsException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Ошибка входа");
        error.put("message", "Неверный логин или пароль");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, String>> handleDisabledException(DisabledException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Аккаунт не активирован");
        error.put("message", "Подтвердите email по ссылке из письма. Проверьте папку «Спам».");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<Map<String, String>> handleNullPointer(NullPointerException ex) {
        log.error("Unexpected NPE", ex);
        Map<String, String> error = new HashMap<>();
        error.put("error", "Внутренняя ошибка");
        error.put("message", "Серверная ошибка. Обратитесь к администратору.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        log.warn("Request failed: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Ошибка запроса");
        error.put("message", ex.getMessage() != null ? ex.getMessage() : "Запрос не выполнен");
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        Map<String, String> error = new HashMap<>();
        error.put("error", "Внутренняя ошибка");
        error.put("message", "Произошла непредвиденная ошибка сервера");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
