package com.example.thesis.repository;

import com.example.thesis.models.FileTextIndex;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FileTextIndexRepository extends JpaRepository<FileTextIndex, UUID> {
    Optional<FileTextIndex> findByFile_Id(UUID fileId);

    void deleteByFile_Id(UUID fileId);
}
