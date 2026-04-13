import api from './axios';
import { FileMetadata, FileHistory, FileNote, FileRevision } from '../types';
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
    uploadChatMedia: async (groupId: string, file: File): Promise<FileMetadata> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<FileMetadata>(`/files/chat-upload/${groupId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    downloadFile: async (fileId: string): Promise<Blob> => {
        const response = await api.get(`/files/download/${fileId}`, {
            responseType: 'blob',
        });
        return response.data;
    },
    previewFile: async (fileId: string): Promise<Blob> => {
        const response = await api.get(`/files/${fileId}/preview`, {
            responseType: 'blob',
        });
        return response.data;
    },
    updateFileContent: async (fileId: string, file: File, expectedVersion?: number): Promise<FileMetadata> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.put<FileMetadata>(`/files/${fileId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            params: expectedVersion !== undefined ? { expectedVersion } : {},
        });
        return response.data;
    },
    getGroupFiles: async (groupId: string): Promise<FileMetadata[]> => {
        try {
            const response = await api.get<FileMetadata[]>(`/files/group/${groupId}`);
            if (!response.data) {
                console.warn('No data returned from getGroupFiles');
                return [];
            }
            return Array.isArray(response.data) ? response.data : [];
        }
        catch (error) {
            console.error('Error fetching group files:', error);
            return [];
        }
    },
    getFileInfo: async (fileId: string): Promise<FileMetadata> => {
        const response = await api.get<FileMetadata>(`/files/${fileId}`);
        return response.data;
    },
    deleteFile: async (fileId: string, expectedVersion?: number): Promise<void> => {
        await api.delete(`/files/${fileId}`, {
            params: expectedVersion !== undefined ? { expectedVersion } : {},
        });
    },
    renameFile: async (fileId: string, newName: string, expectedVersion?: number): Promise<FileMetadata> => {
        const response = await api.put<FileMetadata>(`/files/${fileId}/rename`, null, {
            params: { newName, ...(expectedVersion !== undefined ? { expectedVersion } : {}) },
        });
        return response.data;
    },
    getStorageSettings: async (): Promise<{
        objectStorageEnabled: boolean;
        newFilesTarget: string;
        hybridMode: boolean;
        description: string;
    }> => {
        const response = await api.get('/files/storage/settings');
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
    getGroupStorageInfo: async (groupId: string): Promise<{
        storageUsed: number;
        storageUsedFormatted: string;
    }> => {
        const response = await api.get(`/files/group/${groupId}/storage`);
        return response.data;
    },
    searchFiles: async (groupId: string, query: string): Promise<FileMetadata[]> => {
        const response = await api.get<FileMetadata[]>(`/files/group/${groupId}/search`, {
            params: { query },
        });
        return response.data;
    },
    listRevisions: async (fileId: string): Promise<FileRevision[]> => {
        const response = await api.get<FileRevision[]>(`/files/${fileId}/revisions`);
        return response.data;
    },
    downloadRevision: async (fileId: string, revisionId: string): Promise<Blob> => {
        const response = await api.get(`/files/${fileId}/revisions/${revisionId}/download`, {
            responseType: 'blob',
        });
        return response.data;
    },
    diffRevisions: async (fileId: string, leftId: string, rightId: string): Promise<string> => {
        const response = await api.get<{ unifiedDiff: string }>(`/files/${fileId}/revisions/diff`, {
            params: { leftId, rightId },
        });
        return response.data.unifiedDiff;
    },
    listNotes: async (fileId: string): Promise<FileNote[]> => {
        const response = await api.get<FileNote[]>(`/files/${fileId}/notes`);
        return response.data;
    },
    addNote: async (fileId: string, body: string): Promise<FileNote> => {
        const response = await api.post<FileNote>(`/files/${fileId}/notes`, { body });
        return response.data;
    },
    deleteNote: async (fileId: string, noteId: string): Promise<void> => {
        await api.delete(`/files/${fileId}/notes/${noteId}`);
    },
};
