package com.example.thesis.models.enums;

/**
 * Где лежит содержимое файла: локальный диск приложения или объектное хранилище (S3/MinIO).
 */
public enum StorageBackend {
    /** Файл на диске сервера, путь в {@link com.example.thesis.models.FileMetadata#getFilePath()} */
    LOCAL,
    /** Объект в бакете S3-совместимого хранилища, ключ в {@link com.example.thesis.models.FileMetadata#getObjectKey()} */
    OBJECT_STORE
}
