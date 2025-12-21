package com.example.thesis.repository;

import com.example.thesis.models.FileHistory;
import com.example.thesis.models.FileMetadata;
import com.example.thesis.models.enums.ChangeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FileHistoryRepository extends JpaRepository<FileHistory, UUID> {

    List<FileHistory> findByFile(FileMetadata file);

    List<FileHistory> findByFileId(UUID fileId);

    List<FileHistory> findByChangedById(UUID userId);

    @Query("SELECT fh FROM FileHistory fh WHERE fh.file.parentGroup.id = :groupId " +
            "ORDER BY fh.changeDate DESC")
    List<FileHistory> findByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT fh FROM FileHistory fh WHERE fh.file.parentGroup.id = :groupId " +
            "ORDER BY fh.changeDate DESC")
    Page<FileHistory> findByGroupId(@Param("groupId") UUID groupId, Pageable pageable);

    @Query("SELECT fh FROM FileHistory fh WHERE fh.file.parentGroup.id = :groupId " +
            "AND fh.changeType = :changeType ORDER BY fh.changeDate DESC")
    List<FileHistory> findByGroupIdAndChangeType(@Param("groupId") UUID groupId,
                                                 @Param("changeType") ChangeType changeType);

    @Query("SELECT fh FROM FileHistory fh WHERE fh.file.parentGroup.id = :groupId " +
            "AND fh.changeDate >= :startDate ORDER BY fh.changeDate DESC")
    List<FileHistory> findRecentByGroupId(@Param("groupId") UUID groupId,
                                          @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(fh) FROM FileHistory fh WHERE fh.file.parentGroup.id = :groupId")
    Long countByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT fh FROM FileHistory fh WHERE fh.file.parentGroup.id = :groupId " +
            "AND (fh.changeType = 'UPLOADED' OR fh.changeType = 'DELETED') " +
            "ORDER BY fh.changeDate DESC")
    List<FileHistory> findUploadsAndDeletionsByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT fh FROM FileHistory fh WHERE fh.file.parentGroup.id = :groupId " +
            "AND fh.changedBy.id = :userId ORDER BY fh.changeDate DESC")
    List<FileHistory> findByGroupIdAndUserId(@Param("groupId") UUID groupId,
                                             @Param("userId") UUID userId);
}