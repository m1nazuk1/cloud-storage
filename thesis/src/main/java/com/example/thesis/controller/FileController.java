package com.example.thesis.controller;

import com.example.thesis.models.FileMetadata;
import com.example.thesis.models.FileHistory;
import com.example.thesis.security.SecurityUtils;
import com.example.thesis.service.FileService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FileController {

    private final FileService fileService;
    private final SecurityUtils securityUtils;

    public FileController(FileService fileService, SecurityUtils securityUtils) {
        this.fileService = fileService;
        this.securityUtils = securityUtils;
    }

    @PostMapping("/upload/{groupId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileMetadata> uploadFile(@PathVariable UUID groupId,
                                                   @RequestParam("file") MultipartFile file) {
        var currentUser = securityUtils.getCurrentUser();
        FileMetadata uploadedFile = fileService.uploadFile(file, groupId, currentUser);
        return ResponseEntity.ok(uploadedFile);
    }

    @GetMapping("/download/{fileId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID fileId) {
        var currentUser = securityUtils.getCurrentUser();
        byte[] fileData = fileService.downloadFile(fileId, currentUser);
        FileMetadata fileMetadata = fileService.getFileMetadata(fileId);

        ByteArrayResource resource = new ByteArrayResource(fileData);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileMetadata.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileMetadata.getOriginalName() + "\"")
                .body(resource);
    }

    @GetMapping("/group/{groupId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<FileMetadata>> getGroupFiles(@PathVariable UUID groupId) {
        List<FileMetadata> files = fileService.getGroupFiles(groupId);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/{fileId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileMetadata> getFileInfo(@PathVariable UUID fileId) {
        FileMetadata file = fileService.getFileMetadata(fileId);
        return ResponseEntity.ok(file);
    }

    @DeleteMapping("/{fileId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteFile(@PathVariable UUID fileId) {
        var currentUser = securityUtils.getCurrentUser();
        fileService.deleteFile(fileId, currentUser);
        return ResponseEntity.ok(new AuthController.MessageResponse("File deleted successfully"));
    }

    @PutMapping("/{fileId}/rename")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileMetadata> renameFile(@PathVariable UUID fileId,
                                                   @RequestParam String newName) {
        var currentUser = securityUtils.getCurrentUser();
        fileService.renameFile(fileId, newName, currentUser);
        FileMetadata updatedFile = fileService.getFileMetadata(fileId);
        return ResponseEntity.ok(updatedFile);
    }

    @GetMapping("/{fileId}/history")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<FileHistory>> getFileHistory(@PathVariable UUID fileId) {
        List<FileHistory> history = fileService.getFileHistory(fileId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/group/{groupId}/history")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<FileHistory>> getGroupFileHistory(@PathVariable UUID groupId) {
        List<FileHistory> history = fileService.getGroupFileHistory(groupId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/group/{groupId}/storage")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<StorageInfo> getGroupStorageInfo(@PathVariable UUID groupId) {
        Long storageUsed = fileService.getGroupStorageUsed(groupId);

        StorageInfo info = new StorageInfo();
        info.setStorageUsed(storageUsed);
        info.setStorageUsedFormatted(formatFileSize(storageUsed));

        return ResponseEntity.ok(info);
    }

    @GetMapping("/user/storage")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<StorageInfo> getUserStorageInfo() {
        var currentUser = securityUtils.getCurrentUser();
        Long storageUsed = fileService.getUserStorageUsed(currentUser.getId());

        StorageInfo info = new StorageInfo();
        info.setStorageUsed(storageUsed);
        info.setStorageUsedFormatted(formatFileSize(storageUsed));

        return ResponseEntity.ok(info);
    }

    @GetMapping("/group/{groupId}/search")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<FileMetadata>> searchFiles(@PathVariable UUID groupId,
                                                          @RequestParam String query) {
        List<FileMetadata> files = fileService.searchFilesInGroup(groupId, query);
        return ResponseEntity.ok(files);
    }

    @PutMapping("/{fileId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileMetadata> updateFile(@PathVariable UUID fileId,
                                                   @RequestParam("file") MultipartFile file) {
        var currentUser = securityUtils.getCurrentUser();
        FileMetadata updatedFile = fileService.updateFile(file, fileId, currentUser);
        return ResponseEntity.ok(updatedFile);
    }

    private String formatFileSize(Long bytes) {
        if (bytes == null || bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp-1) + "B";
        return String.format("%.1f %s", bytes / Math.pow(1024, exp), pre);
    }

    static class StorageInfo {
        private Long storageUsed;
        private String storageUsedFormatted;

        // Getters and Setters
        public Long getStorageUsed() { return storageUsed; }
        public void setStorageUsed(Long storageUsed) { this.storageUsed = storageUsed; }

        public String getStorageUsedFormatted() { return storageUsedFormatted; }
        public void setStorageUsedFormatted(String storageUsedFormatted) {
            this.storageUsedFormatted = storageUsedFormatted;
        }
    }
}