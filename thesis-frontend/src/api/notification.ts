import api from './axios';
import { Notification } from '../types';

export const notificationApi = {
    getNotifications: async (): Promise<Notification[]> => {
        const response = await api.get<Notification[]>('/notifications');
        return response.data;
    },

    getUnreadNotifications: async (): Promise<Notification[]> => {
        const response = await api.get<Notification[]>('/notifications/unread');
        return response.data;
    },

    getUnreadCount: async (): Promise<{ count: number }> => {
        const response = await api.get<{ count: number }>('/notifications/count');
        return response.data;
    },

    markAsRead: async (notificationId: string): Promise<void> => {
        await api.put(`/notifications/${notificationId}/read`);
    },

    markAllAsRead: async (): Promise<void> => {
        await api.put('/notifications/read-all');
    },

    deleteNotification: async (notificationId: string): Promise<void> => {
        await api.delete(`/notifications/${notificationId}`);
    },
};