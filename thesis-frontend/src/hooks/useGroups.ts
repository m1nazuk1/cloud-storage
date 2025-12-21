import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi } from '../api/group';
import { useToast } from '../contexts/ToastContext';

export const useGroups = () => {
    useToast();
    const { data: groups = [], isLoading, error } = useQuery({
        queryKey: ['groups'],
        queryFn: groupApi.getMyGroups,
    });

    return { groups, isLoading, error };
};

export const useCreateGroup = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: groupApi.createGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            toast.success('Group deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete group');
        },
    });
};