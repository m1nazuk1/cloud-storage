package com.example.thesis.controller;

import com.example.thesis.config.StorageProperties;
import com.example.thesis.dto.FileDTO;
import com.example.thesis.dto.FileNoteDto;
import com.example.thesis.dto.FileRevisionDto;
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
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FileController {

    private final FileService fileService;
    private final SecurityUtils securityUtils;
    private final StorageProperties storageProperties;

    public FileController(FileService fileService, SecurityUtils securityUtils,
                          StorageProperties storageProperties) {
        this.fileService = fileService;
        this.securityUtils = securityUtils;
        this.storageProperties = storageProperties;
    }

    
    @GetMapping("/storage/settings")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<StorageSettingsResponse> getStorageSettings() {
        boolean s3 = storageProperties.isObjectEnabled();
        String target = storageProperties.getNewFiles();
        StorageSettingsResponse r = new StorageSettingsResponse();
        r.setObjectStorageEnabled(s3);
        r.setNewFilesTarget(target);
        r.setHybridMode(s3);
        if (s3 && storageProperties.isNewFilesObject()) {
            r.setDescription("Гибридное облако: новые файлы — в объектном хранилище (S3/MinIO), ранее загруженные могут оставаться на локальном диске.");
        } else if (s3) {
            r.setDescription("Объектное хранилище подключено; новые файлы пишутся на локальный диск (режим new-files=local).");
        } else {
            r.setDescription("Локальное хранилище на сервере; объектное хранилище отключено.");
        }
        return ResponseEntity.ok(r);
    }

    @PostMapping("/upload/{groupId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileDTO> uploadFile(@PathVariable UUID groupId,
                                              @RequestParam("file") MultipartFile file) {
        System.out.println("[INFO] Uploading file to group: " + groupId + ", file: " + file.getOriginalFilename());

        var currentUser = securityUtils.getCurrentUser();
        FileMetadata uploadedFile = fileService.uploadFile(file, groupId, currentUser);

        System.out.println("[INFO] File uploaded successfully: " + uploadedFile.getId());
        return ResponseEntity.ok(FileDTO.fromEntity(uploadedFile));
    }

    
    @PostMapping("/chat-upload/{groupId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileDTO> uploadChatMedia(@PathVariable UUID groupId,
                                                   @RequestParam("file") MultipartFile file) {
        var currentUser = securityUtils.getCurrentUser();
        FileMetadata uploadedFile = fileService.uploadChatMedia(file, groupId, currentUser);
        return ResponseEntity.ok(FileDTO.fromEntity(uploadedFile));
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

    @GetMapping("/{fileId}/preview")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Resource> previewFile(@PathVariable UUID fileId) {
        var currentUser = securityUtils.getCurrentUser();
        byte[] fileData = fileService.downloadFile(fileId, currentUser);
        FileMetadata fileMetadata = fileService.getFileMetadata(fileId);
        String mime = fileMetadata.getMimeType() != null ? fileMetadata.getMimeType() : "application/octet-stream";
        ByteArrayResource resource = new ByteArrayResource(fileData);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mime))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileMetadata.getOriginalName() + "\"")
                .body(resource);
    }

    @GetMapping("/group/{groupId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<FileDTO>> getGroupFiles(@PathVariable UUID groupId) {
        System.out.println("[INFO] Getting files for group: " + groupId);

        List<FileMetadata> files = fileService.getGroupFiles(groupId);
        List<FileDTO> fileDTOs = files.stream()
                .map(FileDTO::fromEntity)
                .collect(Collectors.toList());

        System.out.println("[INFO] Found " + fileDTOs.size() + " files for group: " + groupId);

        return ResponseEntity.ok(fileDTOs);
    }

    @GetMapping("/{fileId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileMetadata> getFileInfo(@PathVariable UUID fileId) {
        FileMetadata file = fileService.getFileMetadata(fileId);
        return ResponseEntity.ok(file);
    }

    @DeleteMapping("/{fileId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteFile(@PathVariable UUID fileId,
                                        @RequestParam(required = false) Integer expectedVersion) {
        var currentUser = securityUtils.getCurrentUser();
        fileService.deleteFile(fileId, currentUser, expectedVersion);
        return ResponseEntity.ok(new AuthController.MessageResponse("File deleted successfully"));
    }

    @PutMapping("/{fileId}/rename")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileDTO> renameFile(@PathVariable UUID fileId,
                                              @RequestParam String newName,
                                              @RequestParam(required = false) Integer expectedVersion) {
        var currentUser = securityUtils.getCurrentUser();
        fileService.renameFile(fileId, newName, currentUser, expectedVersion);
        FileMetadata updatedFile = fileService.getFileMetadata(fileId);
        return ResponseEntity.ok(FileDTO.fromEntity(updatedFile));
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
                                                   @RequestParam("file") MultipartFile file,
                                                   @RequestParam(required = false) Integer expectedVersion) {
        var currentUser = securityUtils.getCurrentUser();
        FileMetadata updatedFile = fileService.updateFile(file, fileId, currentUser, expectedVersion);
        return ResponseEntity.ok(updatedFile);
    }

    @GetMapping("/{fileId}/revisions")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<FileRevisionDto>> listRevisions(@PathVariable UUID fileId) {
        var currentUser = securityUtils.getCurrentUser();
        return ResponseEntity.ok(fileService.listFileRevisions(fileId, currentUser));
    }

    @GetMapping("/{fileId}/revisions/{revisionId}/download")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadRevision(@PathVariable UUID fileId,
                                                     @PathVariable UUID revisionId) {
        var currentUser = securityUtils.getCurrentUser();
        byte[] data = fileService.downloadRevision(fileId, revisionId, currentUser);
        FileMetadata meta = fileService.getFileMetadata(fileId);
        String mime = meta.getMimeType() != null ? meta.getMimeType() : "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mime))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"v" + revisionId + "-" + meta.getOriginalName() + "\"")
                .body(new ByteArrayResource(data));
    }

    @GetMapping("/{fileId}/revisions/diff")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> diffRevisions(@PathVariable UUID fileId,
                                                             @RequestParam UUID leftId,
                                                             @RequestParam UUID rightId) {
        var currentUser = securityUtils.getCurrentUser();
        String diff = fileService.diffRevisions(fileId, leftId, rightId, currentUser);
        return ResponseEntity.ok(Map.of("unifiedDiff", diff));
    }

    @GetMapping("/{fileId}/notes")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<FileNoteDto>> listNotes(@PathVariable UUID fileId) {
        var currentUser = securityUtils.getCurrentUser();
        return ResponseEntity.ok(fileService.listFileNotes(fileId, currentUser));
    }

    @PostMapping("/{fileId}/notes")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileNoteDto> addNote(@PathVariable UUID fileId,
                                               @RequestBody Map<String, String> body) {
        var currentUser = securityUtils.getCurrentUser();
        String text = body != null ? body.get("body") : null;
        return ResponseEntity.ok(fileService.addFileNote(fileId, text, currentUser));
    }

    @DeleteMapping("/{fileId}/notes/{noteId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteNote(@PathVariable UUID fileId, @PathVariable UUID noteId) {
        var currentUser = securityUtils.getCurrentUser();
        fileService.deleteFileNote(fileId, noteId, currentUser);
        return ResponseEntity.ok(new AuthController.MessageResponse("Note deleted"));
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

        
        public Long getStorageUsed() { return storageUsed; }
        public void setStorageUsed(Long storageUsed) { this.storageUsed = storageUsed; }

        public String getStorageUsedFormatted() { return storageUsedFormatted; }
        public void setStorageUsedFormatted(String storageUsedFormatted) {
            this.storageUsedFormatted = storageUsedFormatted;
        }
    }

    public static class StorageSettingsResponse {
        private boolean objectStorageEnabled;
        private String newFilesTarget;
        private boolean hybridMode;
        private String description;

        public boolean isObjectStorageEnabled() {
            return objectStorageEnabled;
        }

        public void setObjectStorageEnabled(boolean objectStorageEnabled) {
            this.objectStorageEnabled = objectStorageEnabled;
        }

        public String getNewFilesTarget() {
            return newFilesTarget;
        }

        public void setNewFilesTarget(String newFilesTarget) {
            this.newFilesTarget = newFilesTarget;
        }

        public boolean isHybridMode() {
            return hybridMode;
        }

        public void setHybridMode(boolean hybridMode) {
            this.hybridMode = hybridMode;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}