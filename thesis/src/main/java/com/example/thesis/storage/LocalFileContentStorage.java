package com.example.thesis.storage;

import com.example.thesis.models.enums.StorageBackend;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Локальное хранение в каталоге {@code file.upload.dir}.
 */
@Component
public class LocalFileContentStorage implements FileContentStorage {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @Override
    public StorageBackend getBackendType() {
        return StorageBackend.LOCAL;
    }

    @Override
    public void put(String key, InputStream inputStream, long contentLength, String contentType) throws IOException {
        Path dest = resolve(key);
        Files.createDirectories(dest.getParent());
        Files.copy(inputStream, dest, StandardCopyOption.REPLACE_EXISTING);
    }

    @Override
    public byte[] get(String key) throws IOException {
        return Files.readAllBytes(resolve(key));
    }

    @Override
    public void delete(String key) throws IOException {
        Files.deleteIfExists(resolve(key));
    }

    /** key = "{groupId}/{storedFilename}" */
    private Path resolve(String key) {
        return Paths.get(uploadDir).resolve(key).normalize();
    }
}
