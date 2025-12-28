import api from './axios';
import { FileMetadata, FileHistory } from '../types';

export const fileApi = {
    uploadFile: async (groupId: string, file: File): Promise<FileMetadata> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<FileMetadata>(`/files/upload/${groupId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    downloadFile: async (fileId: string): Promise<Blob> => {
        const response = await api.get(`/files/download/${fileId}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    getGroupFiles: async (groupId: string): Promise<FileMetadata[]> => {
        try {
            const response = await api.get<FileMetadata[]>(`/files/group/${groupId}`);
            // ФИКС: Проверяем, что response.data существует и является массивом
            if (!response.data) {
                console.warn('No data returned from getGroupFiles');
                return [];
            }
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error fetching group files:', error);
            return [];
        }
    },

    getFileInfo: async (fileId: string): Promise<FileMetadata> => {
        const response = await api.get<FileMetadata>(`/files/${fileId}`);
        return response.data;
    },

    deleteFile: async (fileId: string): Promise<void> => {
        await api.delete(`/files/${fileId}`);
    },

    renameFile: async (fileId: string, newName: string): Promise<FileMetadata> => {
        const response = await api.put<FileMetadata>(`/files/${fileId}/rename`, null, {
            params: { newName },
        });
        return response.data;
    },

    getFileHistory: async (fileId: string): Promise<FileHistory[]> => {
        const response = await api.get<FileHistory[]>(`/files/${fileId}/history`);
        return response.data;
    },

    getGroupFileHistory: async (groupId: string): Promise<FileHistory[]> => {
        const response = await api.get<FileHistory[]>(`/files/group/${groupId}/history`);
        return response.data;
    },

    getGroupStorageInfo: async (groupId: string): Promise<{ storageUsed: number; storageUsedFormatted: string }> => {
        const response = await api.get(`/files/group/${groupId}/storage`);
        return response.data;
    },

    searchFiles: async (groupId: string, query: string): Promise<FileMetadata[]> => {
        const response = await api.get<FileMetadata[]>(`/files/group/${groupId}/search`, {
            params: { query },
        });
        return response.data;
    },
};