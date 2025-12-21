import api from './axios';
import { WorkGroup, GroupCreateRequest, GroupUpdateRequest, User } from '../types';

export interface GroupWithStats extends WorkGroup {
    memberCount: number;
    fileCount: number;
}

export const groupApi = {
    createGroup: async (data: GroupCreateRequest): Promise<GroupWithStats> => {
        const response = await api.post<GroupWithStats>('/group', data);
        return response.data;
    },

    getMyGroups: async (): Promise<GroupWithStats[]> => {
        const response = await api.get<GroupWithStats[]>('/group/my');
        return response.data.map(group => ({
            ...group,
            memberCount: group.memberCount || 0,
            fileCount: group.fileCount || 0
        }));
    },

    getGroup: async (id: string): Promise<GroupWithStats> => {
        const response = await api.get<GroupWithStats>(`/group/${id}`);
        return {
            ...response.data,
            memberCount: response.data.memberCount || 0,
            fileCount: response.data.fileCount || 0
        };
    },

    updateGroup: async (id: string, data: GroupUpdateRequest): Promise<WorkGroup> => {
        const response = await api.put<WorkGroup>(`/group/${id}`, data);
        return response.data;
    },

    deleteGroup: async (id: string): Promise<void> => {
        await api.delete(`/group/${id}`);
    },

    getInviteToken: async (groupId: string): Promise<{ token: string }> => {
        const response = await api.get(`/group/${groupId}/invite-token`);
        return response.data;
    },

    joinGroup: async (token: string): Promise<void> => {
        await api.post(`/group/join/${token}`);
    },

    getGroupMembers: async (groupId: string): Promise<User[]> => {
        const response = await api.get<User[]>(`/group/${groupId}/members`);
        return response.data;
    },

    addMember: async (groupId: string, userId: string): Promise<void> => {
        await api.post(`/group/${groupId}/members/${userId}`);
    },

    removeMember: async (groupId: string, userId: string): Promise<void> => {
        await api.delete(`/group/${groupId}/members/${userId}`);
    },

    changeMemberRole: async (groupId: string, userId: string, role: string): Promise<void> => {
        await api.put(`/group/${groupId}/members/${userId}/role`, null, { params: { role } });
    },

    searchGroups: async (query: string): Promise<WorkGroup[]> => {
        const response = await api.get<WorkGroup[]>('/group/search', { params: { query } });
        return response.data;
    },
};