package com.example.thesis.repository;

import com.example.thesis.models.Membership;
import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.models.enums.MembershipRole;
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
public interface MembershipRepository extends JpaRepository<Membership, UUID> {

    Optional<Membership> findByUserAndGroup(User user, WorkGroup group);

    Optional<Membership> findByUserIdAndGroupId(UUID userId, UUID groupId);

    List<Membership> findByUser(User user);

    List<Membership> findByGroup(WorkGroup group);

    List<Membership> findByGroupId(UUID groupId);

    List<Membership> findByUserId(UUID userId);

    List<Membership> findByGroupAndRole(WorkGroup group, MembershipRole role);

    @Query("SELECT m FROM Membership m WHERE m.group.id = :groupId AND m.role = :role")
    List<Membership> findByGroupIdAndRole(@Param("groupId") UUID groupId,
                                          @Param("role") MembershipRole role);

    @Query("SELECT COUNT(m) FROM Membership m WHERE m.group.id = :groupId")
    Long countByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT m.role FROM Membership m WHERE m.user.id = :userId AND m.group.id = :groupId")
    Optional<MembershipRole> findRoleByUserIdAndGroupId(@Param("userId") UUID userId,
                                                        @Param("groupId") UUID groupId);

    boolean existsByUserAndGroup(User user, WorkGroup group);

    boolean existsByUserIdAndGroupId(UUID userId, UUID groupId);

    @Transactional
    @Modifying
    @Query("DELETE FROM Membership m WHERE m.user.id = :userId AND m.group.id = :groupId")
    void deleteByUserIdAndGroupId(@Param("userId") UUID userId, @Param("groupId") UUID groupId);

    @Transactional
    @Modifying
    @Query("UPDATE Membership m SET m.role = :newRole WHERE m.user.id = :userId AND m.group.id = :groupId")
    void updateRole(@Param("userId") UUID userId,
                    @Param("groupId") UUID groupId,
                    @Param("newRole") MembershipRole newRole);

    @Query("SELECT m.user.id FROM Membership m WHERE m.group.id = :groupId")
    List<UUID> findUserIdsByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END " +
            "FROM Membership m WHERE m.group.id = :groupId AND m.user.id = :userId")
    boolean isUserMemberOfGroup(@Param("userId") UUID userId, @Param("groupId") UUID groupId);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END " +
            "FROM Membership m WHERE m.group.id = :groupId AND m.user.id = :userId " +
            "AND (m.role = 'CREATOR' OR m.role = 'ADMIN')")
    boolean isUserAdminOrCreator(@Param("userId") UUID userId, @Param("groupId") UUID groupId);
}