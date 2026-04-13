package com.example.thesis.repository;

import com.example.thesis.models.FileNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FileNoteRepository extends JpaRepository<FileNote, UUID> {
    List<FileNote> findByFile_IdOrderByCreatedAtDesc(UUID fileId);
}
