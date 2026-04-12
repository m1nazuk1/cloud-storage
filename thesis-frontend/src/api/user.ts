import api from './axios';
import { User } from '../types';

export const userApi = {
    getProfile: async (): Promise<User> => {
        const response = await api.get<User>('/user/profile');
        return response.data;
    },

    getUser: async (id: string): Promise<User> => {
        const response = await api.get<User>(`/user/${id}`);
        return response.data;
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await api.put<User>('/user/profile', data);
        console.log('Update profile response:', response.data);
        return response.data;
    },

    searchUsers: async (query: string, excludeGroupId?: string): Promise<User[]> => {
        const response = await api.get<User[]>('/user/search', {
            params: { query, ...(excludeGroupId ? { excludeGroupId } : {}) },
        });
        return response.data;
    },

    changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        await api.post('/user/change-password', null, {
            params: { oldPassword, newPassword }
        });
    },

    uploadAvatar: async (file: File): Promise<User> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<User>('/user/profile/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    deleteAvatar: async (): Promise<User> => {
        const response = await api.delete<User>('/user/profile/avatar');
        return response.data;
    },
};