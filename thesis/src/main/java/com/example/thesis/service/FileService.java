package com.example.thesis.service;

import com.example.thesis.models.FileMetadata;
import com.example.thesis.models.FileHistory;
import com.example.thesis.models.User;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;

public interface FileService {
    FileMetadata uploadFile(MultipartFile file, UUID groupId, User uploader);
    byte[] downloadFile(UUID fileId, User downloader);
    FileMetadata getFileMetadata(UUID fileId);
    List<FileMetadata> getGroupFiles(UUID groupId);
    List<FileMetadata> getUserFilesInGroup(UUID groupId, UUID userId);
    void deleteFile(UUID fileId, User requester);
    void renameFile(UUID fileId, String newName, User requester);
    List<FileHistory> getFileHistory(UUID fileId);
    List<FileHistory> getGroupFileHistory(UUID groupId);
    Long getGroupStorageUsed(UUID groupId);
    Long getUserStorageUsed(UUID userId);
    List<FileMetadata> searchFilesInGroup(UUID groupId, String searchTerm);
    FileMetadata updateFile(MultipartFile file, UUID fileId, User requester);
}