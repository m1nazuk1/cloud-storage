package com.example.thesis.repository;

import com.example.thesis.models.User;
import com.example.thesis.models.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<User, UUID> {

    @Query("SELECT u.roles FROM User u WHERE u.id = :userId")
    Set<Role> findRolesByUserId(@Param("userId") UUID userId);

    @Transactional
    @Modifying
    @Query("UPDATE User u SET u.roles = :roles WHERE u.id = :userId")
    void updateUserRoles(@Param("userId") UUID userId, @Param("roles") Set<Role> roles);

    @Query("SELECT u FROM User u WHERE :role MEMBER OF u.roles")
    List<User> findUsersByRole(@Param("role") Role role);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END " +
            "FROM User u WHERE u.id = :userId AND :role MEMBER OF u.roles")
    boolean hasRole(@Param("userId") UUID userId, @Param("role") Role role);
}