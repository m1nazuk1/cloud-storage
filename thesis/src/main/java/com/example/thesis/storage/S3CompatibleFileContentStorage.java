package com.example.thesis.storage;

import com.example.thesis.config.StorageProperties;
import com.example.thesis.models.enums.StorageBackend;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;

/**
 * Объектное хранилище через S3 API (MinIO, AWS S3 и др.).
 */
@Component
@ConditionalOnProperty(name = "app.storage.object-enabled", havingValue = "true")
public class S3CompatibleFileContentStorage implements FileContentStorage {

    private final S3Client s3Client;
    private final StorageProperties properties;

    public S3CompatibleFileContentStorage(S3Client s3Client, StorageProperties properties) {
        this.s3Client = s3Client;
        this.properties = properties;
    }

    @Override
    public StorageBackend getBackendType() {
        return StorageBackend.OBJECT_STORE;
    }

    @Override
    public void put(String key, InputStream inputStream, long contentLength, String contentType) throws IOException {
        PutObjectRequest.Builder b = PutObjectRequest.builder()
                .bucket(properties.getObjectBucket())
                .key(key)
                .contentLength(contentLength);
        if (contentType != null && !contentType.isBlank()) {
            b.contentType(contentType);
        }
        s3Client.putObject(b.build(), RequestBody.fromInputStream(inputStream, contentLength));
    }

    @Override
    public byte[] get(String key) throws IOException {
        GetObjectRequest req = GetObjectRequest.builder()
                .bucket(properties.getObjectBucket())
                .key(key)
                .build();
        try (var response = s3Client.getObject(req)) {
            return response.readAllBytes();
        }
    }

    @Override
    public void delete(String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(properties.getObjectBucket())
                .key(key)
                .build());
    }
}
