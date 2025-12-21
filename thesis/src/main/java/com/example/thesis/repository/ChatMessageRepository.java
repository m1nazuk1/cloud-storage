package com.example.thesis.repository;

import com.example.thesis.models.ChatMessage;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    List<ChatMessage> findByGroup(WorkGroup group);

    List<ChatMessage> findByGroupId(UUID groupId);

    List<ChatMessage> findBySender(User sender);

    List<ChatMessage> findBySenderId(UUID senderId);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.group.id = :groupId ORDER BY cm.timestamp DESC")
    List<ChatMessage> findByGroupIdOrderByTimestampDesc(@Param("groupId") UUID groupId);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.group.id = :groupId ORDER BY cm.timestamp ASC")
    List<ChatMessage> findByGroupIdOrderByTimestampAsc(@Param("groupId") UUID groupId);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.group.id = :groupId ORDER BY cm.timestamp DESC")
    Page<ChatMessage> findByGroupId(@Param("groupId") UUID groupId, Pageable pageable);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.group.id = :groupId " +
            "AND cm.timestamp > :since ORDER BY cm.timestamp ASC")
    List<ChatMessage> findNewMessages(@Param("groupId") UUID groupId,
                                      @Param("since") LocalDateTime since);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.group.id = :groupId " +
            "AND LOWER(cm.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "ORDER BY cm.timestamp DESC")
    List<ChatMessage> searchInGroupChat(@Param("groupId") UUID groupId,
                                        @Param("searchTerm") String searchTerm);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.group.id = :groupId " +
            "AND cm.sender.id = :userId ORDER BY cm.timestamp DESC")
    List<ChatMessage> findByGroupIdAndUserId(@Param("groupId") UUID groupId,
                                             @Param("userId") UUID userId);

    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.group.id = :groupId")
    Long countByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.group.id = :groupId " +
            "AND cm.attachment IS NOT NULL ORDER BY cm.timestamp DESC")
    List<ChatMessage> findMessagesWithAttachments(@Param("groupId") UUID groupId);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.group.id = :groupId " +
            "AND cm.timestamp >= :startDate AND cm.timestamp <= :endDate " +
            "ORDER BY cm.timestamp ASC")
    List<ChatMessage> findMessagesInDateRange(@Param("groupId") UUID groupId,
                                              @Param("startDate") LocalDateTime startDate,
                                              @Param("endDate") LocalDateTime endDate);

    @Transactional
    @Modifying
    @Query("UPDATE ChatMessage cm SET cm.content = :newContent, cm.edited = true, " +
            "cm.editTimestamp = CURRENT_TIMESTAMP WHERE cm.id = :messageId AND cm.sender.id = :userId")
    int updateMessage(@Param("messageId") UUID messageId,
                      @Param("userId") UUID userId,
                      @Param("newContent") String newContent);

    @Transactional
    @Modifying
    @Query("DELETE FROM ChatMessage cm WHERE cm.id = :messageId AND cm.sender.id = :userId")
    int deleteMessage(@Param("messageId") UUID messageId, @Param("userId") UUID userId);

    Optional<ChatMessage> findByIdAndSenderId(UUID id, UUID senderId);
}