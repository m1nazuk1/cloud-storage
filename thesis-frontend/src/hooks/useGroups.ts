import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi } from '../api/group';
import { useToast } from '../contexts/ToastContext';
import { WorkGroup } from '../types';

export const useGroups = () => {
    const toast = useToast();
    const { data, isLoading, error } = useQuery({
        queryKey: ['groups'],
        queryFn: async (): Promise<WorkGroup[]> => {
            try {
                const response: any = await groupApi.getMyGroups();

                // DEBUG
                console.log('API Response:', response);

                // Если ответ массив - возвращаем
                if (Array.isArray(response)) {
                    return response;
                }

                // Если это строка с ошибкой
                if (typeof response === 'string') {
                    console.warn('Server returned string instead of array');
                    // Временное решение - возвращаем пустой массив
                    return [];
                }

                // По умолчанию пустой массив
                return [];
            } catch (err: any) {
                console.error('Error loading groups:', err);
                toast.error('Failed to load groups');
                return [];
            }
        },
    });

    const groups = Array.isArray(data) ? data : [];

    return { groups, isLoading, error };
};

export const useCreateGroup = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: groupApi.createGroup,
        onSuccess: (newGroup) => {
            queryClient.setQueryData(['groups'], (old: WorkGroup[] | undefined) =>
                old ? [...old, newGroup] : [newGroup]
            );
            toast.success('Group created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create group');
        },
    });
};

export const useDeleteGroup = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: groupApi.deleteGroup,
        onSuccess: (_, groupId) => {
            queryClient.setQueryData(['groups'], (old: WorkGroup[] | undefined) =>
                old ? old.filter(g => g.id !== groupId) : []
            );
            toast.success('Group deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete group');
        },
    });
};