package com.example.thesis.service.impl;

import com.example.thesis.exception.ResourceConflictException;
import com.example.thesis.config.StorageProperties;
import com.example.thesis.models.enums.StorageBackend;
import com.example.thesis.service.FileService;
import com.example.thesis.service.NotificationService;
import com.example.thesis.models.FileMetadata;
import com.example.thesis.models.FileHistory;
import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.models.enums.ChangeType;
import com.example.thesis.models.enums.NotificationType;
import com.example.thesis.repository.FileMetadataRepository;
import com.example.thesis.repository.FileHistoryRepository;
import com.example.thesis.repository.WorkGroupRepository;
import com.example.thesis.repository.MembershipRepository;
import com.example.thesis.storage.HybridStorageDecision;
import com.example.thesis.storage.LocalFileContentStorage;
import com.example.thesis.storage.S3CompatibleFileContentStorage;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileService {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    private final FileMetadataRepository fileMetadataRepository;
    private final FileHistoryRepository fileHistoryRepository;
    private final WorkGroupRepository workGroupRepository;
    private final MembershipRepository membershipRepository;
    private final NotificationService notificationService;
    private final LocalFileContentStorage localStorage;
    private final StorageProperties storageProperties;
    private final S3CompatibleFileContentStorage objectStorage;

    public FileServiceImpl(FileMetadataRepository fileMetadataRepository,
                           FileHistoryRepository fileHistoryRepository,
                           WorkGroupRepository workGroupRepository,
                           MembershipRepository membershipRepository,
                           NotificationService notificationService,
                           LocalFileContentStorage localStorage,
                           StorageProperties storageProperties,
                           @Autowired(required = false) S3CompatibleFileContentStorage objectStorage) {
        this.fileMetadataRepository = fileMetadataRepository;
        this.fileHistoryRepository = fileHistoryRepository;
        this.workGroupRepository = workGroupRepository;
        this.membershipRepository = membershipRepository;
        this.notificationService = notificationService;
        this.localStorage = localStorage;
        this.storageProperties = storageProperties;
        this.objectStorage = objectStorage;
    }

    private boolean useObjectStoreForNewUploads() {
        return HybridStorageDecision.useObjectStoreForNewUploads(storageProperties, objectStorage != null);
    }

    private void assertVersionMatch(FileMetadata meta, Integer expectedVersion) {
        if (expectedVersion == null) {
            return;
        }
        if (!expectedVersion.equals(meta.getVersion())) {
            throw new ResourceConflictException(
                    "Файл уже изменён другим пользователем. Обновите список и повторите действие."
            );
        }
    }

    @Override
    @Transactional
    public FileMetadata uploadFile(MultipartFile file, UUID groupId, User uploader) {
        return doUpload(file, groupId, uploader, false);
    }

    @Override
    @Transactional
    public FileMetadata uploadChatMedia(MultipartFile file, UUID groupId, User uploader) {
        return doUpload(file, groupId, uploader, true);
    }

    private FileMetadata doUpload(MultipartFile file, UUID groupId, User uploader, boolean chatMedia) {
        try {
            if (!membershipRepository.isUserMemberOfGroup(uploader.getId(), groupId)) {
                throw new RuntimeException("You are not a member of this group");
            }

            WorkGroup group = workGroupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = getFileExtension(originalFilename);
            String storedFilename = UUID.randomUUID().toString() + (fileExtension.isEmpty() ? "" : "." + fileExtension);
            String relativeKey = groupId + "/" + storedFilename;

            FileMetadata fileMetadata = new FileMetadata();
            fileMetadata.setOriginalName(originalFilename);
            fileMetadata.setStoredName(storedFilename);
            fileMetadata.setFileSize(file.getSize());
            fileMetadata.setFileType(fileExtension);
            fileMetadata.setMimeType(file.getContentType());
            fileMetadata.setUploader(uploader);
            fileMetadata.setParentGroup(group);
            fileMetadata.setUploadDate(LocalDateTime.now());
            fileMetadata.setLastModified(LocalDateTime.now());
            fileMetadata.setChatMedia(chatMedia);

            if (useObjectStoreForNewUploads()) {
                fileMetadata.setStorageBackend(StorageBackend.OBJECT_STORE);
                fileMetadata.setObjectKey(relativeKey);
                fileMetadata.setFilePath(null);
                objectStorage.put(relativeKey, file.getInputStream(), file.getSize(),
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            } else {
                localStorage.put(
                        relativeKey,
                        file.getInputStream(),
                        file.getSize(),
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream"
                );
                fileMetadata.setStorageBackend(StorageBackend.LOCAL);
                fileMetadata.setObjectKey(null);
                fileMetadata.setFilePath(Paths.get(uploadDir).resolve(relativeKey).toString());
            }

            FileMetadata savedFile = fileMetadataRepository.save(fileMetadata);

            FileHistory history = new FileHistory(
                    ChangeType.UPLOADED,
                    savedFile,
                    uploader,
                    chatMedia ? "Chat media" : "File uploaded"
            );
            fileHistoryRepository.save(history);

            if (!chatMedia) {
                notifyGroupAboutFile(
                        NotificationType.FILE_ADDED,
                        group,
                        groupId,
                        uploader.getId(),
                        uploader.getUsername() + " загрузил файл «" + originalFilename + "»"
                );
            }

            return savedFile;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] downloadFile(UUID fileId, User downloader) {
        FileMetadata fileMetadata = getFileMetadata(fileId);

        if (!membershipRepository.isUserMemberOfGroup(downloader.getId(), fileMetadata.getParentGroup().getId())) {
            throw new RuntimeException("You don't have permission to download this file");
        }

        try {
            if (fileMetadata.getStorageBackend() == StorageBackend.OBJECT_STORE) {
                if (objectStorage == null || fileMetadata.getObjectKey() == null) {
                    throw new RuntimeException("Object storage unavailable for this file");
                }
                return objectStorage.get(fileMetadata.getObjectKey());
            }
            Path filePath = Paths.get(fileMetadata.getFilePath());
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to download file: " + e.getMessage(), e);
        }
    }

    @Override
    public FileMetadata getFileMetadata(UUID fileId) {
        return fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + fileId));
    }

    @Override
    public List<FileMetadata> getGroupFiles(UUID groupId) {
        List<FileMetadata> files = fileMetadataRepository.findActiveFilesByGroupId(groupId);
        for (FileMetadata file : files) {
            Hibernate.initialize(file.getUploader());
            Hibernate.initialize(file.getParentGroup());
        }
        return files;
    }

    @Override
    public List<FileMetadata> getUserFilesInGroup(UUID groupId, UUID userId) {
        return fileMetadataRepository.findUserFilesInGroup(userId, groupId);
    }

    @Override
    @Transactional
    public void deleteFile(UUID fileId, User requester, Integer expectedVersion) {
        FileMetadata fileMetadata = getFileMetadata(fileId);
        assertVersionMatch(fileMetadata, expectedVersion);

        boolean isUploader = fileMetadata.getUploader().getId().equals(requester.getId());
        boolean isAdmin = membershipRepository.isUserAdminOrCreator(requester.getId(),
                fileMetadata.getParentGroup().getId());

        if (!isUploader && !isAdmin) {
            throw new RuntimeException("You don't have permission to delete this file");
        }

        fileMetadata.setDeleted(true);
        fileMetadataRepository.save(fileMetadata);

        FileHistory history = new FileHistory(
                ChangeType.DELETED,
                fileMetadata,
                requester,
                "File deleted"
        );
        fileHistoryRepository.save(history);

        WorkGroup g = fileMetadata.getParentGroup();
        Hibernate.initialize(g);
        notifyGroupAboutFile(
                NotificationType.FILE_DELETED,
                g,
                g.getId(),
                requester.getId(),
                requester.getUsername() + " удалил файл «" + fileMetadata.getOriginalName() + "»"
        );
    }

    @Override
    @Transactional
    public void renameFile(UUID fileId, String newName, User requester, Integer expectedVersion) {
        FileMetadata fileMetadata = getFileMetadata(fileId);
        assertVersionMatch(fileMetadata, expectedVersion);

        boolean isUploader = fileMetadata.getUploader().getId().equals(requester.getId());
        boolean isAdmin = membershipRepository.isUserAdminOrCreator(requester.getId(),
                fileMetadata.getParentGroup().getId());

        if (!isUploader && !isAdmin) {
            throw new RuntimeException("You don't have permission to rename this file");
        }

        String oldName = fileMetadata.getOriginalName();
        fileMetadata.setOriginalName(newName);
        fileMetadata.setLastModified(LocalDateTime.now());
        fileMetadataRepository.save(fileMetadata);

        FileHistory history = new FileHistory(
                ChangeType.RENAMED,
                fileMetadata,
                requester,
                "Renamed from: " + oldName
        );
        fileHistoryRepository.save(history);

        WorkGroup g = fileMetadata.getParentGroup();
        Hibernate.initialize(g);
        notifyGroupAboutFile(
                NotificationType.FILE_UPDATED,
                g,
                g.getId(),
                requester.getId(),
                requester.getUsername() + " переименовал файл «" + oldName + "» в «" + newName + "»"
        );
    }

    private void notifyGroupAboutFile(NotificationType type, WorkGroup group, UUID groupId,
                                      UUID excludeUserId, String messageBody) {
        WorkGroup g = group;
        if (g == null || g.getName() == null) {
            g = workGroupRepository.findById(groupId).orElse(null);
        }
        String prefix = (g != null && g.getName() != null) ? "«" + g.getName() + "»: " : "";
        notificationService.createGroupNotification(type, prefix + messageBody, groupId, excludeUserId);
    }

    @Override
    public List<FileHistory> getFileHistory(UUID fileId) {
        return fileHistoryRepository.findByFileId(fileId);
    }

    @Override
    public List<FileHistory> getGroupFileHistory(UUID groupId) {
        return fileHistoryRepository.findByGroupId(groupId);
    }

    @Override
    public Long getGroupStorageUsed(UUID groupId) {
        Long size = fileMetadataRepository.getTotalStorageByGroupId(groupId);
        return size != null ? size : 0L;
    }

    @Override
    public Long getUserStorageUsed(UUID userId) {
        Long size = fileMetadataRepository.getTotalStorageByUserId(userId);
        return size != null ? size : 0L;
    }

    @Override
    public List<FileMetadata> searchFilesInGroup(UUID groupId, String searchTerm) {
        return fileMetadataRepository.searchFilesInGroup(groupId, searchTerm);
    }

    @Override
    @Transactional
    public FileMetadata updateFile(MultipartFile file, UUID fileId, User requester, Integer expectedVersion) {
        FileMetadata existingFile = getFileMetadata(fileId);
        assertVersionMatch(existingFile, expectedVersion);

        if (!existingFile.getUploader().getId().equals(requester.getId())) {
            throw new RuntimeException("Only the uploader can update this file");
        }

        try {
            if (existingFile.getStorageBackend() == StorageBackend.OBJECT_STORE) {
                if (objectStorage == null || existingFile.getObjectKey() == null) {
                    throw new RuntimeException("Object storage unavailable");
                }
                objectStorage.put(existingFile.getObjectKey(), file.getInputStream(), file.getSize(),
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            } else {
                Path oldFilePath = Paths.get(existingFile.getFilePath());
                Files.copy(file.getInputStream(), oldFilePath, StandardCopyOption.REPLACE_EXISTING);
            }

            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            existingFile.setOriginalName(originalFilename);
            existingFile.setFileSize(file.getSize());
            existingFile.setFileType(getFileExtension(originalFilename));
            existingFile.setMimeType(file.getContentType());
            existingFile.setLastModified(LocalDateTime.now());
            return fileMetadataRepository.save(existingFile);
        } catch (IOException e) {
            throw new RuntimeException("Failed to update file: " + e.getMessage(), e);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
