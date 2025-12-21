package com.example.thesis.repository;

import com.example.thesis.models.Notification;
import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.models.enums.NotificationType;
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
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByUser(User user);

    List<Notification> findByUserId(UUID userId);

    List<Notification> findByGroup(WorkGroup group);

    List<Notification> findByGroupId(UUID groupId);

    List<Notification> findByUserAndRead(User user, boolean read);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.read = false " +
            "ORDER BY n.createdDate DESC")
    List<Notification> findUnreadByUserId(@Param("userId") UUID userId);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId " +
            "ORDER BY n.createdDate DESC")
    Page<Notification> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.read = false")
    Long countUnreadByUserId(@Param("userId") UUID userId);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.group.id = :groupId " +
            "ORDER BY n.createdDate DESC")
    List<Notification> findByUserIdAndGroupId(@Param("userId") UUID userId,
                                              @Param("groupId") UUID groupId);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.type = :type " +
            "ORDER BY n.createdDate DESC")
    List<Notification> findByUserIdAndType(@Param("userId") UUID userId,
                                           @Param("type") NotificationType type);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.createdDate >= :since " +
            "ORDER BY n.createdDate DESC")
    List<Notification> findRecentByUserId(@Param("userId") UUID userId,
                                          @Param("since") LocalDateTime since);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.read = true, n.readDate = CURRENT_TIMESTAMP " +
            "WHERE n.id = :notificationId AND n.user.id = :userId")
    int markAsRead(@Param("notificationId") UUID notificationId,
                   @Param("userId") UUID userId);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.read = true, n.readDate = CURRENT_TIMESTAMP " +
            "WHERE n.user.id = :userId AND n.read = false")
    int markAllAsRead(@Param("userId") UUID userId);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.read = true, n.readDate = CURRENT_TIMESTAMP " +
            "WHERE n.user.id = :userId AND n.group.id = :groupId AND n.read = false")
    int markAllAsReadByGroup(@Param("userId") UUID userId, @Param("groupId") UUID groupId);

    @Transactional
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId AND n.read = true " +
            "AND n.createdDate < :cutoffDate")
    int deleteOldReadNotifications(@Param("userId") UUID userId,
                                   @Param("cutoffDate") LocalDateTime cutoffDate);

    @Transactional
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId AND n.group.id = :groupId")
    int deleteByUserIdAndGroupId(@Param("userId") UUID userId, @Param("groupId") UUID groupId);

    @Query("SELECT n FROM Notification n WHERE n.user.id IN :userIds AND n.group.id = :groupId " +
            "AND n.type = :type ORDER BY n.createdDate DESC")
    List<Notification> findForUsersInGroup(@Param("userIds") List<UUID> userIds,
                                           @Param("groupId") UUID groupId,
                                           @Param("type") NotificationType type);
}