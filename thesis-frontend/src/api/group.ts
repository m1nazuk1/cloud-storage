import api from './axios';
import {WorkGroup, GroupUpdateRequest, User, GroupDetail, GroupStats} from '../types';

export interface GroupWithStats extends WorkGroup {
    memberCount: number;
    fileCount: number;
}

export const groupApi = {
    createGroup: async (data: { name: string; description?: string }): Promise<WorkGroup> => {
        const response = await api.post<WorkGroup>('/group', data);
        return response.data;
    },

    getMyGroups: async (): Promise<WorkGroup[]> => {
        const response = await api.get<WorkGroup[]>('/group/my');
        return response.data;
    },

    getGroup: async (id: string): Promise<GroupDetail> => {
        const response = await api.get<GroupDetail>(`/group/${id}`);
        return response.data;
    },

    getGroupStats: async (groupId: string): Promise<GroupStats> => {
        const response = await api.get<GroupStats>(`/group/${groupId}/stats`);
        return response.data;
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
        try {
            const response = await api.get<User[]>(`/group/${groupId}/members`);
            // ФИКС: Проверяем, что response.data существует и является массивом
            if (!response.data) {
                console.warn('No data returned from getGroupMembers');
                return [];
            }
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error fetching group members:', error);
            return [];
        }
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