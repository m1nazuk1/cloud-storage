// api/activity.ts
import api from './axios';

export interface Activity {
    id: string;
    type: string;
    message: string;
    createdDate: string;
    groupId: string;
    groupName: string;
    userId: string;
    userName: string;
    fileId?: string;
    fileName?: string;
}

export const activityApi = {
    getRecentActivity: async (): Promise<Activity[]> => {
        const response = await api.get<Activity[]>('/activity/recent');
        return response.data;
    },

    getGroupActivity: async (groupId: string): Promise<Activity[]> => {
        const response = await api.get<Activity[]>(`/activity/group/${groupId}`);
        return response.data;
    }
};