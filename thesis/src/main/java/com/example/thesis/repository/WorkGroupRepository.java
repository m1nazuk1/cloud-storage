package com.example.thesis.repository;

import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.models.enums.MembershipRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkGroupRepository extends JpaRepository<WorkGroup, UUID> {

    Optional<WorkGroup> findByInviteToken(String inviteToken);

    List<WorkGroup> findByCreator(User creator);

    @Query("SELECT wg FROM WorkGroup wg JOIN wg.memberships m WHERE m.user.id = :userId")
    List<WorkGroup> findGroupsByUserId(@Param("userId") UUID userId);

    @Query("SELECT wg FROM WorkGroup wg WHERE wg.creator.id = :userId OR " +
            "wg.id IN (SELECT m.group.id FROM Membership m WHERE m.user.id = :userId)")
    List<WorkGroup> findGroupsByUserWithMembership(@Param("userId") UUID userId);

    @Query("SELECT wg FROM WorkGroup wg WHERE wg.creator.id = :userId")
    List<WorkGroup> findCreatedGroupsByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(wg) FROM WorkGroup wg JOIN wg.memberships m WHERE wg.id = :groupId")
    Long countMembersByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT COUNT(wg) FROM WorkGroup wg JOIN wg.files f WHERE wg.id = :groupId AND f.deleted = false")
    Long countFilesByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT wg FROM WorkGroup wg JOIN wg.memberships m " +
            "WHERE wg.id = :groupId AND m.user.id = :userId AND m.role = :role")
    Optional<WorkGroup> findGroupByUserAndRole(@Param("groupId") UUID groupId,
                                               @Param("userId") UUID userId,
                                               @Param("role") MembershipRole role);

    @Query("SELECT wg FROM WorkGroup wg WHERE LOWER(wg.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(wg.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<WorkGroup> searchGroups(@Param("searchTerm") String searchTerm);

    @Query("SELECT wg FROM WorkGroup wg JOIN wg.memberships m " +
            "WHERE m.user.id = :userId AND (LOWER(wg.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(wg.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<WorkGroup> searchGroupsForUser(@Param("userId") UUID userId,
                                        @Param("searchTerm") String searchTerm);
}