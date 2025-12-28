package com.example.thesis.repository;

import com.example.thesis.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    // Должен быть унаследован от JpaRepository
    // List<User> findAll();

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByActivationCode(String activationCode);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    List<User> findByEnabled(boolean enabled);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> searchUsers(@Param("searchTerm") String searchTerm);

    @Query("SELECT u FROM User u JOIN u.memberships m WHERE m.group.id = :groupId")
    List<User> findUsersByGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT u FROM User u WHERE u.enabled = true AND u.id IN " +
            "(SELECT m.user.id FROM Membership m WHERE m.group.id = :groupId)")
    List<User> findActiveUsersByGroupId(@Param("groupId") UUID groupId);
}