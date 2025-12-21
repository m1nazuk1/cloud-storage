import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileApi } from '../api/file';
import { useToast } from '../contexts/ToastContext';

export const useGroupFiles = (groupId: string) => {
    const { data: files = [], isLoading, error } = useQuery({
        queryKey: ['files', groupId],
        queryFn: () => fileApi.getGroupFiles(groupId),
        enabled: !!groupId,
    });

    return { files, isLoading, error };
};

export const useUploadFile = (groupId: string) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (file: File) => fileApi.uploadFile(groupId, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files', groupId] });
            toast.success('File uploaded successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to upload file');
        },
    });
};

export const useDeleteFile = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: fileApi.deleteFile,
        onSuccess: (_) => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            toast.success('File deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete file');
        },
    });
};