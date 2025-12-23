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

    searchUsers: async (query: string): Promise<User[]> => {
        const response = await api.get<User[]>('/user/search', { params: { query } });
        return response.data;
    },

    changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        await api.post('/user/change-password', null, {
            params: { oldPassword, newPassword }
        });
    },
};