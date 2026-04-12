import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi, GroupMembershipPrefs } from '../api/group';
import { useToast } from '../contexts/ToastContext';
import { WorkGroup } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useGroups = () => {
    const toast = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const userId = user?.id;

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['groups', userId],
        enabled: !!userId,
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
                    toast.error('Сессия истекла. Войдите снова.');
                } else {
                    toast.error('Не удалось загрузить группы');
                }

                return [];
            }
        },
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
    });

    const forceRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['groups'] });
        queryClient.invalidateQueries({ queryKey: ['user-stats'] });
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
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

    return useMutation({
        mutationFn: groupApi.createGroup,
        onSuccess: async (newGroup) => {
            await queryClient.invalidateQueries({ queryKey: ['groups'] });
            await queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            await queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
            if (newGroup?.id) {
                await queryClient.invalidateQueries({ queryKey: ['group', newGroup.id] });
            }
            toast.success('Группа создана');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Не удалось создать группу';
            toast.error(message);
        },
    });
};

export const useUpdateGroupMembershipPrefs = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ groupId, ...prefs }: { groupId: string } & GroupMembershipPrefs) =>
            groupApi.updateMembershipPreferences(groupId, prefs),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
        onError: (error: unknown) => {
            const msg =
                error && typeof error === 'object' && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(typeof msg === 'string' ? msg : 'Не удалось сохранить настройки');
        },
    });
};

export const useDeleteGroup = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: groupApi.deleteGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            toast.success('Группа удалена');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Не удалось удалить группу');
        },
    });
};