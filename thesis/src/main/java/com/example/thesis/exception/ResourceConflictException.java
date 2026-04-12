package com.example.thesis.exception;

/**
 * Конкурентное изменение ресурса (оптимистическая блокировка по версии).
 */
public class ResourceConflictException extends RuntimeException {

    public ResourceConflictException(String message) {
        super(message);
    }
}
