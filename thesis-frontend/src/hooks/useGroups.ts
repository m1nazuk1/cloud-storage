import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi } from '../api/group';
import { useToast } from '../contexts/ToastContext';
import { WorkGroup } from '../types';
import {useAuth} from "../contexts/AuthContext";

export const useGroups = () => {
    const toast = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['groups'],
        queryFn: async (): Promise<WorkGroup[]> => {
            try {
                const response = await groupApi.getMyGroups();

                if (Array.isArray(response)) {
                    return response;
                }

                console.error('Unexpected response format:', response);
                return [];
            } catch (err: any) {
                console.error('Error loading groups:', err);

                if (err.response?.status === 401) {
                    toast.error('Session expired. Please login again.');
                } else {
                    toast.error('Failed to load groups');
                }

                return [];
            }
        },
        staleTime: 1 * 60 * 1000, // 1 минута
        gcTime: 5 * 60 * 1000, // 5 минут
        refetchOnWindowFocus: false, // Отключаем авто-обновление при фокусе
        refetchOnMount: true,
    });

    const forceRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['groups'] });
        queryClient.invalidateQueries({ queryKey: ['user-stats'] });
        refetch();
    };

    const groups = Array.isArray(data) ? data : [];

    return {
        groups,
        isLoading,
        error,
        refetch,
        forceRefresh
    };
};

export const useCreateGroup = () => {
    const queryClient = useQueryClient();
    const toast = useToast();
    const { refreshUserData } = useAuth(); // Добавляем refreshUserData

    return useMutation({
        mutationFn: groupApi.createGroup,
        onSuccess: async (newGroup) => {
            // Обновляем кэш
            queryClient.setQueryData(['groups'], (old: WorkGroup[] | undefined) =>
                old ? [...old, newGroup] : [newGroup]
            );

            // ОБНОВЛЯЕМ данные пользователя
            await refreshUserData();

            toast.success('Group created successfully');

            // Перезагружаем страницу через 500ms
            setTimeout(() => {
                window.location.reload();
            }, 500);
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to create group';
            toast.error(message);
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