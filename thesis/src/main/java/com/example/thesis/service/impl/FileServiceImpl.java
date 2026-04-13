package com.example.thesis.service.impl;

import com.example.thesis.config.StorageProperties;
import com.example.thesis.dto.FileNoteDto;
import com.example.thesis.dto.FileRevisionDto;
import com.example.thesis.exception.ResourceConflictException;
import com.example.thesis.models.FileContentRevision;
import com.example.thesis.models.FileHistory;
import com.example.thesis.models.FileMetadata;
import com.example.thesis.models.FileNote;
import com.example.thesis.models.FileTextIndex;
import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.models.enums.ChangeType;
import com.example.thesis.models.enums.NotificationType;
import com.example.thesis.models.enums.StorageBackend;
import com.example.thesis.repository.FileContentRevisionRepository;
import com.example.thesis.repository.FileHistoryRepository;
import com.example.thesis.repository.FileMetadataRepository;
import com.example.thesis.repository.FileNoteRepository;
import com.example.thesis.repository.MembershipRepository;
import com.example.thesis.repository.WorkGroupRepository;
import com.example.thesis.service.FileService;
import com.example.thesis.service.FileTextExtractionService;
import com.example.thesis.service.NotificationService;
import com.example.thesis.storage.HybridStorageDecision;
import com.example.thesis.storage.LocalFileContentStorage;
import com.example.thesis.storage.S3CompatibleFileContentStorage;
import com.github.difflib.DiffUtils;
import com.github.difflib.UnifiedDiffUtils;
import com.github.difflib.patch.Patch;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FileServiceImpl implements FileService {

    private static final long MAX_INDEX_BYTES = 25L * 1024 * 1024;

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
    private final FileTextExtractionService textExtractionService;
    private final FileContentRevisionRepository fileContentRevisionRepository;
    private final FileNoteRepository fileNoteRepository;

    public FileServiceImpl(FileMetadataRepository fileMetadataRepository,
                           FileHistoryRepository fileHistoryRepository,
                           WorkGroupRepository workGroupRepository,
                           MembershipRepository membershipRepository,
                           NotificationService notificationService,
                           LocalFileContentStorage localStorage,
                           StorageProperties storageProperties,
                           @Autowired(required = false) S3CompatibleFileContentStorage objectStorage,
                           FileTextExtractionService textExtractionService,
                           FileContentRevisionRepository fileContentRevisionRepository,
                           FileNoteRepository fileNoteRepository) {
        this.fileMetadataRepository = fileMetadataRepository;
        this.fileHistoryRepository = fileHistoryRepository;
        this.workGroupRepository = workGroupRepository;
        this.membershipRepository = membershipRepository;
        this.notificationService = notificationService;
        this.localStorage = localStorage;
        this.storageProperties = storageProperties;
        this.objectStorage = objectStorage;
        this.textExtractionService = textExtractionService;
        this.fileContentRevisionRepository = fileContentRevisionRepository;
        this.fileNoteRepository = fileNoteRepository;
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

    private void assertMember(FileMetadata fm, User user) {
        UUID gid = fm.getParentGroup().getId();
        if (!membershipRepository.isUserMemberOfGroup(user.getId(), gid)) {
            throw new RuntimeException("You don't have permission to access this file");
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
                maybeIndexAfterUpload(savedFile);
            }

            return savedFile;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    private void maybeIndexAfterUpload(FileMetadata fm) {
        try {
            if (fm.getFileSize() != null && fm.getFileSize() > MAX_INDEX_BYTES) {
                return;
            }
            byte[] bytes = readFileBytesInternal(fm);
            indexFileContent(fm, bytes);
        } catch (Exception ignored) {
            // indexing is best-effort
        }
    }

    private byte[] readFileBytesInternal(FileMetadata fm) throws IOException {
        if (fm.getStorageBackend() == StorageBackend.OBJECT_STORE) {
            if (objectStorage == null || fm.getObjectKey() == null) {
                throw new IOException("Object storage unavailable");
            }
            return objectStorage.get(fm.getObjectKey());
        }
        return Files.readAllBytes(Paths.get(fm.getFilePath()));
    }

    private void indexFileContent(FileMetadata fm, byte[] bytes) {
        String text = textExtractionService.extractForIndex(bytes, fm.getMimeType(), fm.getOriginalName());
        FileTextIndex idx = fm.getTextIndex();
        if (idx == null) {
            idx = new FileTextIndex();
            idx.setFile(fm);
            fm.setTextIndex(idx);
        }
        idx.setContentText(text);
        fileMetadataRepository.save(fm);
    }

    @Override
    public byte[] downloadFile(UUID fileId, User downloader) {
        FileMetadata fileMetadata = getFileMetadata(fileId);
        assertMember(fileMetadata, downloader);

        try {
            return readFileBytesInternal(fileMetadata);
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

        WorkGroup g = fileMetadata.getParentGroup();
        Hibernate.initialize(g);
        if (g.getCoverFileId() != null && g.getCoverFileId().equals(fileId)) {
            g.setCoverFileId(null);
            workGroupRepository.save(g);
        }

        FileHistory history = new FileHistory(
                ChangeType.DELETED,
                fileMetadata,
                requester,
                "File deleted"
        );
        fileHistoryRepository.save(history);

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
        String q = searchTerm == null ? "" : searchTerm.trim();
        if (q.isEmpty()) {
            return getGroupFiles(groupId);
        }
        List<FileMetadata> list = fileMetadataRepository.searchFilesInGroup(groupId, q);
        for (FileMetadata f : list) {
            Hibernate.initialize(f.getUploader());
            Hibernate.initialize(f.getParentGroup());
        }
        return list;
    }

    @Override
    @Transactional
    public FileMetadata updateFile(MultipartFile file, UUID fileId, User requester, Integer expectedVersion) {
        FileMetadata existingFile = getFileMetadata(fileId);
        assertVersionMatch(existingFile, expectedVersion);
        assertMember(existingFile, requester);

        if (existingFile.isChatMedia()) {
            throw new RuntimeException("Chat media files cannot be replaced");
        }

        try {
            byte[] newBytes = file.getBytes();
            byte[] oldBytes = readFileBytesInternal(existingFile);

            UUID gid = existingFile.getParentGroup().getId();
            int snapVer = existingFile.getVersion();
            String revisionKey = gid + "/revisions/" + fileId + "/v" + snapVer + "/" + existingFile.getStoredName();

            storeBlobAtKey(existingFile.getStorageBackend(), revisionKey, oldBytes,
                    existingFile.getMimeType() != null ? existingFile.getMimeType() : "application/octet-stream");

            String snapText = textExtractionService.extractForSnapshot(oldBytes,
                    existingFile.getMimeType(), existingFile.getOriginalName());

            FileContentRevision rev = new FileContentRevision();
            rev.setFile(existingFile);
            rev.setFileVersionSnapshot(snapVer);
            rev.setStorageBackend(existingFile.getStorageBackend());
            rev.setStorageKey(revisionKey);
            rev.setSizeBytes(oldBytes.length);
            rev.setMimeType(existingFile.getMimeType());
            rev.setOriginalNameSnapshot(existingFile.getOriginalName());
            rev.setTextSnapshot(snapText.isEmpty() ? null : snapText);
            rev.setCreatedBy(requester);
            fileContentRevisionRepository.save(rev);

            String ct = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            if (existingFile.getStorageBackend() == StorageBackend.OBJECT_STORE) {
                if (objectStorage == null || existingFile.getObjectKey() == null) {
                    throw new RuntimeException("Object storage unavailable");
                }
                objectStorage.put(existingFile.getObjectKey(), new ByteArrayInputStream(newBytes), newBytes.length, ct);
            } else {
                Path oldFilePath = Paths.get(existingFile.getFilePath());
                Files.copy(new ByteArrayInputStream(newBytes), oldFilePath, StandardCopyOption.REPLACE_EXISTING);
            }

            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            existingFile.setOriginalName(originalFilename);
            existingFile.setFileSize((long) newBytes.length);
            existingFile.setFileType(getFileExtension(originalFilename));
            existingFile.setMimeType(file.getContentType());
            existingFile.setLastModified(LocalDateTime.now());
            FileMetadata saved = fileMetadataRepository.save(existingFile);

            if (newBytes.length <= MAX_INDEX_BYTES) {
                indexFileContent(saved, newBytes);
            }

            FileHistory history = new FileHistory(
                    ChangeType.UPDATED,
                    saved,
                    requester,
                    "File content replaced"
            );
            fileHistoryRepository.save(history);

            WorkGroup g = existingFile.getParentGroup();
            Hibernate.initialize(g);
            notifyGroupAboutFile(
                    NotificationType.FILE_UPDATED,
                    g,
                    gid,
                    requester.getId(),
                    requester.getUsername() + " обновил файл «" + originalFilename + "»"
            );

            return saved;
        } catch (IOException e) {
            throw new RuntimeException("Failed to update file: " + e.getMessage(), e);
        }
    }

    private void storeBlobAtKey(StorageBackend backend, String key, byte[] data, String contentType) throws IOException {
        if (backend == StorageBackend.OBJECT_STORE) {
            if (objectStorage == null) {
                throw new IOException("Object storage unavailable");
            }
            objectStorage.put(key, new ByteArrayInputStream(data), data.length, contentType);
        } else {
            localStorage.put(key, new ByteArrayInputStream(data), data.length, contentType);
        }
    }

    private byte[] readRevisionBytes(FileContentRevision rev) throws IOException {
        if (rev.getStorageBackend() == StorageBackend.OBJECT_STORE) {
            if (objectStorage == null) {
                throw new IOException("Object storage unavailable");
            }
            return objectStorage.get(rev.getStorageKey());
        }
        return localStorage.get(rev.getStorageKey());
    }

    @Override
    public List<FileRevisionDto> listFileRevisions(UUID fileId, User user) {
        FileMetadata fm = getFileMetadata(fileId);
        assertMember(fm, user);
        List<FileContentRevision> revs = fileContentRevisionRepository.findByFile_IdOrderByFileVersionSnapshotDesc(fileId);
        List<FileRevisionDto> out = new ArrayList<>();
        for (FileContentRevision r : revs) {
            Hibernate.initialize(r.getCreatedBy());
            FileRevisionDto d = new FileRevisionDto();
            d.setId(r.getId());
            d.setFileVersionSnapshot(r.getFileVersionSnapshot());
            d.setSizeBytes(r.getSizeBytes());
            d.setMimeType(r.getMimeType());
            d.setOriginalNameSnapshot(r.getOriginalNameSnapshot());
            d.setHasTextSnapshot(r.getTextSnapshot() != null && !r.getTextSnapshot().isEmpty());
            d.setCreatedAt(r.getCreatedAt());
            d.setCreatedById(r.getCreatedBy().getId());
            d.setCreatedByUsername(r.getCreatedBy().getUsername());
            out.add(d);
        }
        return out;
    }

    @Override
    public byte[] downloadRevision(UUID fileId, UUID revisionId, User user) {
        FileMetadata fm = getFileMetadata(fileId);
        assertMember(fm, user);
        FileContentRevision rev = fileContentRevisionRepository.findByIdAndFile_Id(revisionId, fileId)
                .orElseThrow(() -> new RuntimeException("Revision not found"));
        try {
            return readRevisionBytes(rev);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read revision: " + e.getMessage(), e);
        }
    }

    @Override
    public String diffRevisions(UUID fileId, UUID leftRevisionId, UUID rightRevisionId, User user) {
        FileMetadata fm = getFileMetadata(fileId);
        assertMember(fm, user);
        FileContentRevision left = fileContentRevisionRepository.findByIdAndFile_Id(leftRevisionId, fileId)
                .orElseThrow(() -> new RuntimeException("Left revision not found"));
        FileContentRevision right = fileContentRevisionRepository.findByIdAndFile_Id(rightRevisionId, fileId)
                .orElseThrow(() -> new RuntimeException("Right revision not found"));

        String a = left.getTextSnapshot();
        String b = right.getTextSnapshot();
        if (a == null || b == null || a.isEmpty() || b.isEmpty()) {
            return "Для сравнения нужны текстовые снимки обеих версий (txt, код, PDF с извлекаемым текстом).";
        }

        List<String> orig = Arrays.asList(a.split("\r?\n", -1));
        List<String> rev = Arrays.asList(b.split("\r?\n", -1));
        Patch<String> patch = DiffUtils.diff(orig, rev);
        List<String> unified = UnifiedDiffUtils.generateUnifiedDiff(
                "v" + left.getFileVersionSnapshot(),
                "v" + right.getFileVersionSnapshot(),
                orig,
                patch,
                3
        );
        return unified.stream().collect(Collectors.joining("\n"));
    }

    @Override
    public List<FileNoteDto> listFileNotes(UUID fileId, User user) {
        FileMetadata fm = getFileMetadata(fileId);
        assertMember(fm, user);
        return fileNoteRepository.findByFile_IdOrderByCreatedAtDesc(fileId).stream().map(n -> {
            Hibernate.initialize(n.getAuthor());
            FileNoteDto d = new FileNoteDto();
            d.setId(n.getId());
            d.setBody(n.getBody());
            d.setCreatedAt(n.getCreatedAt());
            d.setAuthorId(n.getAuthor().getId());
            d.setAuthorUsername(n.getAuthor().getUsername());
            return d;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FileNoteDto addFileNote(UUID fileId, String body, User user) {
        FileMetadata fm = getFileMetadata(fileId);
        assertMember(fm, user);
        String t = body == null ? "" : body.trim();
        if (t.isEmpty()) {
            throw new RuntimeException("Note body is required");
        }
        if (t.length() > 4000) {
            throw new RuntimeException("Note is too long");
        }
        FileNote note = new FileNote();
        note.setFile(fm);
        note.setAuthor(user);
        note.setBody(t);
        FileNote saved = fileNoteRepository.save(note);
        Hibernate.initialize(saved.getAuthor());
        FileNoteDto d = new FileNoteDto();
        d.setId(saved.getId());
        d.setBody(saved.getBody());
        d.setCreatedAt(saved.getCreatedAt());
        d.setAuthorId(saved.getAuthor().getId());
        d.setAuthorUsername(saved.getAuthor().getUsername());
        return d;
    }

    @Override
    @Transactional
    public void deleteFileNote(UUID fileId, UUID noteId, User user) {
        FileMetadata fm = getFileMetadata(fileId);
        assertMember(fm, user);
        FileNote note = fileNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        if (!note.getFile().getId().equals(fileId)) {
            throw new RuntimeException("Note does not belong to this file");
        }
        boolean author = note.getAuthor().getId().equals(user.getId());
        boolean admin = membershipRepository.isUserAdminOrCreator(user.getId(), fm.getParentGroup().getId());
        if (!author && !admin) {
            throw new RuntimeException("You can only delete your own notes (or ask a group admin)");
        }
        fileNoteRepository.delete(note);
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
