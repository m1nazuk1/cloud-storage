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
            queryClient.invalidateQueries({ queryKey: ['group', groupId] });
            queryClient.invalidateQueries({ queryKey: ['group', groupId, 'members'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
            queryClient.invalidateQueries({ queryKey: ['storage-settings'] });
            toast.success('Файл загружен');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Не удалось загрузить файл');
        },
    });
};
export const useDeleteFile = () => {
    const queryClient = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (args: {
            fileId: string;
            expectedVersion?: number;
        }) => fileApi.deleteFile(args.fileId, args.expectedVersion),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['group'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['storage-settings'] });
            toast.success('Файл удалён');
        },
    });
};
