package com.example.thesis.repository;

import com.example.thesis.models.FileMetadata;
import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, UUID> {

    List<FileMetadata> findByParentGroup(WorkGroup group);

    List<FileMetadata> findByParentGroupId(UUID groupId);

    List<FileMetadata> findByUploader(User uploader);

    List<FileMetadata> findByUploaderId(UUID uploaderId);

    Optional<FileMetadata> findByStoredName(String storedName);

    @Query("SELECT f FROM FileMetadata f WHERE f.parentGroup.id = :groupId AND f.deleted = false " +
            "ORDER BY f.uploadDate DESC")
    List<FileMetadata> findActiveFilesByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT f FROM FileMetadata f WHERE f.parentGroup.id = :groupId AND f.deleted = false " +
            "ORDER BY f.uploadDate DESC")
    Page<FileMetadata> findActiveFilesByGroupId(@Param("groupId") UUID groupId, Pageable pageable);

    @Query("SELECT f FROM FileMetadata f WHERE f.parentGroup.id = :groupId AND f.uploader.id = :userId " +
            "AND f.deleted = false ORDER BY f.uploadDate DESC")
    List<FileMetadata> findUserFilesInGroup(@Param("userId") UUID userId, @Param("groupId") UUID groupId);

    @Query("SELECT COUNT(f) FROM FileMetadata f WHERE f.parentGroup.id = :groupId AND f.deleted = false")
    Long countActiveFilesByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT SUM(f.fileSize) FROM FileMetadata f WHERE f.parentGroup.id = :groupId AND f.deleted = false")
    Long getTotalStorageByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT SUM(f.fileSize) FROM FileMetadata f WHERE f.uploader.id = :userId AND f.deleted = false")
    Long getTotalStorageByUserId(@Param("userId") UUID userId);

    @Query("SELECT f FROM FileMetadata f WHERE f.parentGroup.id = :groupId AND f.deleted = false " +
            "AND (LOWER(f.originalName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(f.fileType) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY f.uploadDate DESC")
    List<FileMetadata> searchFilesInGroup(@Param("groupId") UUID groupId,
                                          @Param("searchTerm") String searchTerm);

    @Query("SELECT f FROM FileMetadata f WHERE f.parentGroup.id = :groupId " +
            "AND f.fileType IN :fileTypes AND f.deleted = false " +
            "ORDER BY f.uploadDate DESC")
    List<FileMetadata> findFilesByTypesInGroup(@Param("groupId") UUID groupId,
                                               @Param("fileTypes") List<String> fileTypes);

    @Transactional
    @Modifying
    @Query("UPDATE FileMetadata f SET f.deleted = true WHERE f.id = :fileId")
    void softDelete(@Param("fileId") UUID fileId);

    @Transactional
    @Modifying
    @Query("UPDATE FileMetadata f SET f.deleted = true WHERE f.parentGroup.id = :groupId")
    void softDeleteAllByGroupId(@Param("groupId") UUID groupId);

    @Transactional
    @Modifying
    @Query("UPDATE FileMetadata f SET f.originalName = :newName, f.lastModified = CURRENT_TIMESTAMP " +
            "WHERE f.id = :fileId")
    void renameFile(@Param("fileId") UUID fileId, @Param("newName") String newName);

    @Query("SELECT DISTINCT f.fileType FROM FileMetadata f WHERE f.parentGroup.id = :groupId " +
            "AND f.deleted = false AND f.fileType IS NOT NULL")
    List<String> findDistinctFileTypesByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT f FROM FileMetadata f WHERE f.parentGroup.id = :groupId " +
            "AND f.uploadDate >= :startDate AND f.deleted = false " +
            "ORDER BY f.uploadDate DESC")
    List<FileMetadata> findRecentFiles(@Param("groupId") UUID groupId,
                                       @Param("startDate") java.time.LocalDateTime startDate);
}