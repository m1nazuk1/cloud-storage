package com.example.thesis.models;

import com.example.thesis.models.enums.MembershipRole;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "memberships",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "group_id"})
        })
public class Membership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @CreationTimestamp
    @Column(name = "joined_date", nullable = false, updatable = false)
    private LocalDateTime joinedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private MembershipRole role = MembershipRole.MEMBER;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private WorkGroup group;

    public Membership() {
    }

    public Membership(User user, WorkGroup group, MembershipRole role) {
        this.user = user;
        this.group = group;
        this.role = role;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public LocalDateTime getJoinedDate() {
        return joinedDate;
    }

    public void setJoinedDate(LocalDateTime joinedDate) {
        this.joinedDate = joinedDate;
    }

    public MembershipRole getRole() {
        return role;
    }

    public void setRole(MembershipRole role) {
        this.role = role;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public WorkGroup getGroup() {
        return group;
    }

    public void setGroup(WorkGroup group) {
        this.group = group;
    }

    public boolean isCreator() {
        return role == MembershipRole.CREATOR;
    }

    public boolean isAdmin() {
        return role == MembershipRole.ADMIN || role == MembershipRole.CREATOR;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Membership that = (Membership) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Membership{" +
                "id=" + id +
                ", user=" + (user != null ? user.getUsername() : "null") +
                ", group=" + (group != null ? group.getName() : "null") +
                ", role=" + role +
                '}';
    }
}