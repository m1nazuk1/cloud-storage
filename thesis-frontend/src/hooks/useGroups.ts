import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi } from '../api/group';
import { useToast } from '../contexts/ToastContext';
import { WorkGroup } from '../types';
import React from "react";

export const useGroups = () => {
    const toast = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['groups'],
        queryFn: async (): Promise<WorkGroup[]> => {
            try {
                // Явно указываем тип ответа
                const response: any = await groupApi.getMyGroups();
                console.log('Groups API Response:', response);

                // Убедимся, что возвращаем массив
                if (Array.isArray(response)) {
                    return response;
                }

                // Если response - это объект с данными
                if (response && response.data && Array.isArray(response.data)) {
                    return response.data;
                }

                // Если response - это строка или что-то еще
                console.error('Unexpected response format:', response);
                return [];
            } catch (err: any) {
                console.error('Error loading groups:', err);
                toast.error(err.response?.data?.message || 'Failed to load groups');
                return [];
            }
        },
        staleTime: 5 * 60 * 1000, // 5 минут
        gcTime: 10 * 60 * 1000, // 10 минут
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });

    // Функция для принудительного обновления
    const forceRefresh = React.useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['groups'] });
    }, [queryClient]);

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

    return useMutation({
        mutationFn: groupApi.createGroup,
        onSuccess: (newGroup) => {
            // Обновляем кэш
            queryClient.setQueryData(['groups'], (old: WorkGroup[] | undefined) =>
                old ? [...old, newGroup] : [newGroup]
            );

            toast.success('Group created successfully');

            // Перезагружаем страницу через 1 секунду
            setTimeout(() => {
                window.location.reload();
            }, 500);

            // ИЛИ перенаправляем на страницу группы
            // navigate(`/groups/${newGroup.id}`);
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