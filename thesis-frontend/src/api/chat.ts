import api from './axios';
import { ChatMessage, ChatMessageRequest } from '../types';

export const chatApi = {
    sendMessage: async (data: ChatMessageRequest): Promise<ChatMessage> => {
        const response = await api.post<ChatMessage>('/chat/send', data);
        return response.data;
    },

    getGroupMessages: async (groupId: string): Promise<ChatMessage[]> => {
        const response = await api.get<ChatMessage[]>(`/chat/group/${groupId}`);
        return response.data;
    },

    editMessage: async (messageId: string, newContent: string): Promise<void> => {
        await api.put(`/chat/${messageId}`, null, { params: { newContent } });
    },

    deleteMessage: async (messageId: string): Promise<void> => {
        await api.delete(`/chat/${messageId}`);
    },

    searchMessages: async (groupId: string, query: string): Promise<ChatMessage[]> => {
        const response = await api.get<ChatMessage[]>(`/chat/group/${groupId}/search`, {
            params: { query },
        });
        return response.data;
    },
};