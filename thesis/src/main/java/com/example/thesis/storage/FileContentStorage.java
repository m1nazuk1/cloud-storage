package com.example.thesis.storage;

import com.example.thesis.models.enums.StorageBackend;

import java.io.IOException;
import java.io.InputStream;

public interface FileContentStorage {

    StorageBackend getBackendType();

    void put(String key, InputStream inputStream, long contentLength, String contentType) throws IOException;

    byte[] get(String key) throws IOException;

    void delete(String key) throws IOException;
}
