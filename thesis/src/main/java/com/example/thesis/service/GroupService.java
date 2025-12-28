package com.example.thesis.service;

import com.example.thesis.models.WorkGroup;
import com.example.thesis.models.User;
import com.example.thesis.dto.GroupCreateRequest;
import com.example.thesis.dto.GroupUpdateRequest;
import java.util.List;
import java.util.UUID;

public interface GroupService {
    WorkGroup createGroup(GroupCreateRequest request, User creator);
    WorkGroup updateGroup(UUID groupId, GroupUpdateRequest request, User requester);
    void deleteGroup(UUID groupId, User requester);
    WorkGroup getGroupById(UUID groupId);
    WorkGroup getGroupByInviteToken(String token);
    List<WorkGroup> getUserGroups(UUID userId);
    List<WorkGroup> getUserCreatedGroups(UUID userId);
    String generateInviteToken(UUID groupId, User requester);
    void joinGroup(String inviteToken, User user);
    void addMember(UUID groupId, UUID userId, User requester);
    void removeMember(UUID groupId, UUID userId, User requester);
    void changeMemberRole(UUID groupId, UUID userId, String role, User requester);
    boolean isUserMember(UUID groupId, UUID userId);
    boolean isUserAdminOrCreator(UUID groupId, UUID userId);
    List<User> getGroupMembers(UUID groupId);
    List<WorkGroup> searchGroups(String searchTerm, UUID userId);
    int getGroupMemberCount(UUID groupId);
    int getGroupFileCount(UUID groupId);
}