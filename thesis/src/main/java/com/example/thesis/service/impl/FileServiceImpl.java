package com.example.thesis.service.impl;

import com.example.thesis.service.FileService;
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
    // Убираем NotificationService, пока он вызывает проблемы
    // private final NotificationService notificationService;

    public FileServiceImpl(FileMetadataRepository fileMetadataRepository,
                           FileHistoryRepository fileHistoryRepository,
                           WorkGroupRepository workGroupRepository,
                           MembershipRepository membershipRepository
            /*, NotificationService notificationService */) {
        this.fileMetadataRepository = fileMetadataRepository;
        this.fileHistoryRepository = fileHistoryRepository;
        this.workGroupRepository = workGroupRepository;
        this.membershipRepository = membershipRepository;
        // this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public FileMetadata uploadFile(MultipartFile file, UUID groupId, User uploader) {
        System.out.println("[FILE] Uploading file: " + file.getOriginalFilename() +
                " to group: " + groupId +
                " by user: " + uploader.getUsername() +
                " (userId: " + uploader.getId() + ")");

        try {
            // Проверка прав доступа
            if (!membershipRepository.isUserMemberOfGroup(uploader.getId(), groupId)) {
                System.err.println("[FILE] User " + uploader.getId() + " is not a member of group " + groupId);
                throw new RuntimeException("You are not a member of this group");
            }

            WorkGroup group = workGroupRepository.findById(groupId)
                    .orElseThrow(() -> {
                        System.err.println("[FILE] Group not found: " + groupId);
                        return new RuntimeException("Group not found");
                    });

            // Создание директории, если не существует
            Path uploadPath = Paths.get(uploadDir, groupId.toString());
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Генерация уникального имени файла
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = getFileExtension(originalFilename);
            String storedFilename = UUID.randomUUID().toString() + (fileExtension.isEmpty() ? "" : "." + fileExtension);
            Path filePath = uploadPath.resolve(storedFilename);

            System.out.println("[FILE] Saving file to: " + filePath);

            // Сохранение файла
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Сохранение метаданных
            FileMetadata fileMetadata = new FileMetadata();
            fileMetadata.setOriginalName(originalFilename);
            fileMetadata.setStoredName(storedFilename);
            fileMetadata.setFilePath(filePath.toString());
            fileMetadata.setFileSize(file.getSize());
            fileMetadata.setFileType(fileExtension);
            fileMetadata.setMimeType(file.getContentType());
            fileMetadata.setUploader(uploader);
            fileMetadata.setParentGroup(group);
            fileMetadata.setUploadDate(LocalDateTime.now());
            fileMetadata.setLastModified(LocalDateTime.now());

            FileMetadata savedFile = fileMetadataRepository.save(fileMetadata);
            System.out.println("[FILE] File metadata saved with ID: " + savedFile.getId());

            // Запись в историю
            FileHistory history = new FileHistory(
                    ChangeType.UPLOADED,
                    savedFile,
                    uploader,
                    "File uploaded"
            );
            fileHistoryRepository.save(history);
            System.out.println("[FILE] History recorded");

            System.out.println("[FILE] File upload completed successfully: " + originalFilename);
            return savedFile;

        } catch (IOException e) {
            System.err.println("[FILE] IO Error during upload: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        } catch (Exception e) {
            System.err.println("[FILE] Unexpected error during upload: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    @Override
    public byte[] downloadFile(UUID fileId, User downloader) {
        FileMetadata fileMetadata = getFileMetadata(fileId);
        System.out.println("[FILE] Downloading file: " + fileMetadata.getOriginalName());

        // Проверка прав доступа
        if (!membershipRepository.isUserMemberOfGroup(downloader.getId(), fileMetadata.getParentGroup().getId())) {
            throw new RuntimeException("You don't have permission to download this file");
        }

        try {
            Path filePath = Paths.get(fileMetadata.getFilePath());
            byte[] data = Files.readAllBytes(filePath);
            System.out.println("[FILE] File downloaded successfully: " + fileMetadata.getOriginalName());
            return data;

        } catch (IOException e) {
            System.err.println("[FILE] Download failed: " + e.getMessage());
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
        System.out.println("[FILE] Getting files for group: " + groupId);
        List<FileMetadata> files = fileMetadataRepository.findActiveFilesByGroupId(groupId);
        System.out.println("[FILE] Found " + files.size() + " files");
        return files;
    }

    @Override
    public List<FileMetadata> getUserFilesInGroup(UUID groupId, UUID userId) {
        return fileMetadataRepository.findUserFilesInGroup(userId, groupId);
    }

    @Override
    @Transactional
    public void deleteFile(UUID fileId, User requester) {
        System.out.println("[FILE] Deleting file: " + fileId);

        FileMetadata fileMetadata = getFileMetadata(fileId);

        // Проверка прав (только загрузивший или админ/создатель может удалить)
        boolean isUploader = fileMetadata.getUploader().getId().equals(requester.getId());
        boolean isAdmin = membershipRepository.isUserAdminOrCreator(requester.getId(),
                fileMetadata.getParentGroup().getId());

        if (!isUploader && !isAdmin) {
            throw new RuntimeException("You don't have permission to delete this file");
        }

        // Мягкое удаление (помечаем как удаленный)
        fileMetadata.setDeleted(true);
        fileMetadataRepository.save(fileMetadata);

        // Запись в историю
        FileHistory history = new FileHistory(
                ChangeType.DELETED,
                fileMetadata,
                requester,
                "File deleted"
        );
        fileHistoryRepository.save(history);

        // ВРЕМЕННО ОТКЛЮЧАЕМ УВЕДОМЛЕНИЯ
        /*
        // Отправка уведомлений
        notificationService.createGroupNotification(
                NotificationType.FILE_DELETED,
                requester.getUsername() + " deleted " + fileMetadata.getOriginalName(),
                fileMetadata.getParentGroup().getId(),
                requester.getId()
        );
        */

        System.out.println("[FILE] File deleted successfully");
    }

    @Override
    @Transactional
    public void renameFile(UUID fileId, String newName, User requester) {
        FileMetadata fileMetadata = getFileMetadata(fileId);

        // Проверка прав (только загрузивший или админ/создатель может переименовать)
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

        // Запись в историю
        FileHistory history = new FileHistory(
                ChangeType.RENAMED,
                fileMetadata,
                requester,
                "Renamed from: " + oldName
        );
        fileHistoryRepository.save(history);
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
    public FileMetadata updateFile(MultipartFile file, UUID fileId, User requester) {
        FileMetadata existingFile = getFileMetadata(fileId);

        // Проверка прав (только загрузивший может обновить)
        if (!existingFile.getUploader().getId().equals(requester.getId())) {
            throw new RuntimeException("Only the uploader can update this file");
        }

        // Удаляем старый файл
        try {
            Path oldFilePath = Paths.get(existingFile.getFilePath());
            Files.deleteIfExists(oldFilePath);
        } catch (IOException e) {
            // Логируем ошибку, но продолжаем
            System.err.println("Failed to delete old file: " + e.getMessage());
        }

        // Загружаем новый файл
        return uploadFile(file, existingFile.getParentGroup().getId(), requester);
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}