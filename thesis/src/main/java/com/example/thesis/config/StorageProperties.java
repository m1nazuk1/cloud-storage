package com.example.thesis.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Настройки гибридного хранилища: локальный диск + опционально S3/MinIO.
 */
@Component
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    /**
     * Включить клиент объектного хранилища (MinIO/S3).
     */
    private boolean objectEnabled = false;

    private String objectEndpoint = "http://127.0.0.1:9000";
    private String objectRegion = "us-east-1";
    private String objectBucket = "thesis-files";
    private String objectAccessKey = "minioadmin";
    private String objectSecretKey = "minioadmin";

    /**
     * Куда сохранять новые загрузки: {@code local} или {@code object}.
     * В режиме гибридного облака часть записей остаётся LOCAL (наследие), новые могут идти в OBJECT_STORE.
     */
    private String newFiles = "local";

    public boolean isObjectEnabled() {
        return objectEnabled;
    }

    public void setObjectEnabled(boolean objectEnabled) {
        this.objectEnabled = objectEnabled;
    }

    public String getObjectEndpoint() {
        return objectEndpoint;
    }

    public void setObjectEndpoint(String objectEndpoint) {
        this.objectEndpoint = objectEndpoint;
    }

    public String getObjectRegion() {
        return objectRegion;
    }

    public void setObjectRegion(String objectRegion) {
        this.objectRegion = objectRegion;
    }

    public String getObjectBucket() {
        return objectBucket;
    }

    public void setObjectBucket(String objectBucket) {
        this.objectBucket = objectBucket;
    }

    public String getObjectAccessKey() {
        return objectAccessKey;
    }

    public void setObjectAccessKey(String objectAccessKey) {
        this.objectAccessKey = objectAccessKey;
    }

    public String getObjectSecretKey() {
        return objectSecretKey;
    }

    public void setObjectSecretKey(String objectSecretKey) {
        this.objectSecretKey = objectSecretKey;
    }

    public String getNewFiles() {
        return newFiles;
    }

    public void setNewFiles(String newFiles) {
        this.newFiles = newFiles;
    }

    public boolean isNewFilesObject() {
        return "object".equalsIgnoreCase(newFiles);
    }
}
