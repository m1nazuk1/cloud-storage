package com.example.thesis.service.impl;

import com.example.thesis.service.GroupService;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.models.User;
import com.example.thesis.models.Membership;
import com.example.thesis.models.enums.MembershipRole;
import com.example.thesis.models.enums.NotificationType;
import com.example.thesis.repository.WorkGroupRepository;
import com.example.thesis.repository.MembershipRepository;
import com.example.thesis.repository.UserRepository;
import com.example.thesis.dto.GroupCreateRequest;
import com.example.thesis.dto.GroupUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class GroupServiceImpl implements GroupService {

    private final WorkGroupRepository workGroupRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;
    // Временно отключаем
    // private final NotificationService notificationService;

    public GroupServiceImpl(WorkGroupRepository workGroupRepository,
                            MembershipRepository membershipRepository,
                            UserRepository userRepository
            /*, NotificationService notificationService */) {
        this.workGroupRepository = workGroupRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        // this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public WorkGroup createGroup(GroupCreateRequest request, User creator) {
        System.out.println("[GROUP] Creating group: " + request.getName() + " by user: " + creator.getUsername());

        WorkGroup group = new WorkGroup();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        group.setCreator(creator);
        group.setInviteToken(generateUniqueInviteToken());

        WorkGroup savedGroup = workGroupRepository.save(group);
        System.out.println("[GROUP] Group saved with ID: " + savedGroup.getId());

        // Создатель автоматически становится участником с ролью CREATOR
        Membership membership = new Membership(creator, savedGroup, MembershipRole.CREATOR);
        membershipRepository.save(membership);
        System.out.println("[GROUP] Membership created for creator");

        return savedGroup;
    }

    @Override
    @Transactional
    public WorkGroup updateGroup(UUID groupId, GroupUpdateRequest request, User requester) {
        WorkGroup group = getGroupById(groupId);

        // Проверка прав
        if (!isUserAdminOrCreator(groupId, requester.getId())) {
            throw new RuntimeException("You don't have permission to update this group");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            group.setName(request.getName());
        }

        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }

        // Если нужно обновить invite token
        if (request.isRegenerateToken()) {
            group.setInviteToken(generateUniqueInviteToken());
        }

        return workGroupRepository.save(group);
    }

    @Override
    @Transactional
    public void deleteGroup(UUID groupId, User requester) {
        WorkGroup group = getGroupById(groupId);

        // Только создатель может удалить группу
        Membership membership = membershipRepository.findByUserIdAndGroupId(requester.getId(), groupId)
                .orElseThrow(() -> new RuntimeException("You are not a member of this group"));

        if (!membership.isCreator()) {
            throw new RuntimeException("Only the creator can delete the group");
        }

        workGroupRepository.delete(group);
    }

    @Override
    public WorkGroup getGroupById(UUID groupId) {
        return workGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));
    }

    @Override
    public WorkGroup getGroupByInviteToken(String token) {
        return workGroupRepository.findByInviteToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invite token"));
    }

    @Override
    public List<WorkGroup> getUserGroups(UUID userId) {
        return workGroupRepository.findGroupsByUserWithMembership(userId);
    }

    @Override
    public List<WorkGroup> getUserCreatedGroups(UUID userId) {
        return workGroupRepository.findCreatedGroupsByUserId(userId);
    }

    @Override
    @Transactional
    public String generateInviteToken(UUID groupId, User requester) {
        WorkGroup group = getGroupById(groupId);

        // Проверка прав
        if (!isUserAdminOrCreator(groupId, requester.getId())) {
            throw new RuntimeException("You don't have permission to generate invite token");
        }

        String newToken = generateUniqueInviteToken();
        group.setInviteToken(newToken);
        workGroupRepository.save(group);

        return newToken;
    }

    @Override
    @Transactional
    public void joinGroup(String inviteToken, User user) {
        WorkGroup group = getGroupByInviteToken(inviteToken);

        // Проверка, не является ли пользователь уже участником
        if (membershipRepository.existsByUserAndGroup(user, group)) {
            throw new RuntimeException("You are already a member of this group");
        }

        // Добавление пользователя в группу
        Membership membership = new Membership(user, group, MembershipRole.MEMBER);
        membershipRepository.save(membership);

        // ВРЕМЕННО ОТКЛЮЧАЕМ УВЕДОМЛЕНИЯ
        /*
        // Отправка уведомлений
        notificationService.createGroupNotification(
                NotificationType.USER_JOINED,
                user.getUsername() + " joined the group",
                group.getId(),
                user.getId()
        );
        */
    }

    @Override
    @Transactional
    public void addMember(UUID groupId, UUID userId, User requester) {
        WorkGroup group = getGroupById(groupId);
        User userToAdd = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Проверка прав
        if (!isUserAdminOrCreator(groupId, requester.getId())) {
            throw new RuntimeException("You don't have permission to add members");
        }

        // Проверка, не является ли пользователь уже участником
        if (membershipRepository.existsByUserAndGroup(userToAdd, group)) {
            throw new RuntimeException("User is already a member of this group");
        }

        Membership membership = new Membership(userToAdd, group, MembershipRole.MEMBER);
        membershipRepository.save(membership);

        // ВРЕМЕННО ОТКЛЮЧАЕМ УВЕДОМЛЕНИЯ
        /*
        // Отправка уведомлений
        notificationService.createGroupNotification(
                NotificationType.USER_JOINED,
                userToAdd.getUsername() + " was added to the group by " + requester.getUsername(),
                group.getId(),
                userToAdd.getId()
        );
        */
    }

    @Override
    @Transactional
    public void removeMember(UUID groupId, UUID userId, User requester) {
        WorkGroup group = getGroupById(groupId);

        // Проверка прав
        if (!isUserAdminOrCreator(groupId, requester.getId())) {
            throw new RuntimeException("You don't have permission to remove members");
        }

        // Проверка, не пытается ли пользователь удалить себя
        if (requester.getId().equals(userId)) {
            throw new RuntimeException("You cannot remove yourself from the group");
        }

        // Проверка, не пытается ли админ удалить создателя
        Membership targetMembership = membershipRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this group"));

        if (targetMembership.isCreator()) {
            throw new RuntimeException("Cannot remove the group creator");
        }

        // Удаление участника
        membershipRepository.deleteByUserIdAndGroupId(userId, groupId);

        // Отправка уведомлений
//        notificationService.createGroupNotification(
//                NotificationType.USER_REMOVED,
//                targetMembership.getUser().getUsername() + " was removed from the group by " + requester.getUsername(),
//                group.getId(),
//                userId
//        );
    }

    @Override
    @Transactional
    public void changeMemberRole(UUID groupId, UUID userId, String role, User requester) {
        WorkGroup group = getGroupById(groupId);

        // Проверка прав
        if (!isUserAdminOrCreator(groupId, requester.getId())) {
            throw new RuntimeException("You don't have permission to change member roles");
        }

        Membership targetMembership = membershipRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this group"));

        // Проверка, не пытается ли изменить роль создателя
        if (targetMembership.isCreator()) {
            throw new RuntimeException("Cannot change the role of the group creator");
        }

        MembershipRole newRole;
        try {
            newRole = MembershipRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + role);
        }

        // Проверка, не пытается ли админ назначить кого-то создателем
        if (newRole == MembershipRole.CREATOR) {
            throw new RuntimeException("Cannot assign CREATOR role");
        }

        targetMembership.setRole(newRole);
        membershipRepository.save(targetMembership);
    }

    @Override
    public boolean isUserMember(UUID groupId, UUID userId) {
        return membershipRepository.isUserMemberOfGroup(userId, groupId);
    }

    @Override
    public boolean isUserAdminOrCreator(UUID groupId, UUID userId) {
        return membershipRepository.isUserAdminOrCreator(userId, groupId);
    }

    @Override
    public List<User> getGroupMembers(UUID groupId) {
        return userRepository.findUsersByGroupId(groupId);
    }

    @Override
    public List<WorkGroup> searchGroups(String searchTerm, UUID userId) {
        return workGroupRepository.searchGroupsForUser(userId, searchTerm);
    }

    private String generateUniqueInviteToken() {
        String token;
        do {
            token = UUID.randomUUID().toString().substring(0, 8);
        } while (workGroupRepository.findByInviteToken(token).isPresent());
        return token;
    }
}