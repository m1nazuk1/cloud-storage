import api from './axios';

export interface UserStats {
    totalGroups: number;
    totalMembers: number;
    totalFiles: number;
    totalStorageUsed: number;
}

export const statsApi = {
    getUserStats: async (): Promise<UserStats> => {
        const response = await api.get<UserStats>('/stats/user');
        return response.data;
    },

    getUserQuickStats: async (): Promise<UserStats> => {
        const response = await api.get<UserStats>('/stats/user/quick');
        return response.data;
    }
};