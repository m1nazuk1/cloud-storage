package com.example.thesis.repository;

import com.example.thesis.models.FileContentRevision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FileContentRevisionRepository extends JpaRepository<FileContentRevision, UUID> {
    List<FileContentRevision> findByFile_IdOrderByFileVersionSnapshotDesc(UUID fileId);

    Optional<FileContentRevision> findByIdAndFile_Id(UUID revisionId, UUID fileId);
}
