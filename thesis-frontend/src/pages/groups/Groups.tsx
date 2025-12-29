import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Users, FileText, MoreVertical, Folder, RefreshCw } from 'lucide-react';
import { useGroups, useCreateGroup, useDeleteGroup } from '../../hooks/useGroups';
import { groupCreateSchema } from '../../utils/validation';
import { WorkGroup } from '../../types';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type GroupFormData = {
    name: string;
    description?: string;
};

const Groups: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { groups, isLoading, forceRefresh } = useGroups();
    const createGroupMutation = useCreateGroup();
    const deleteGroupMutation = useDeleteGroup();
    const navigate = useNavigate();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<GroupFormData>({
        resolver: zodResolver(groupCreateSchema),
        mode: 'onTouched',
    });

    const onSubmit = async (data: GroupFormData) => {
        try {
            await createGroupMutation.mutateAsync(data);
            reset();
            setShowCreateModal(false);
            // Принудительно обновляем данные через 500ms
            setTimeout(() => {
                forceRefresh();
            }, 500);
        } catch (error) {
            console.error('Failed to create group:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!Array.isArray(groups)) {
        console.error('Groups is not an array:', groups);
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-xl mb-4">⚠️ Data Error</div>
                <p className="text-gray-600 mb-4">Failed to load groups. Please refresh the page.</p>
                <Button variant="primary" onClick={() => window.location.reload()}>
                    Refresh Page
                </Button>
            </div>
        );
    }

    const filteredGroups = groups.filter(group =>
        group &&
        group.name &&
        (group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleDeleteGroup = async (groupId: string) => {
        if (window.confirm('Are you sure you want to delete this group?')) {
            try {
                await deleteGroupMutation.mutateAsync(groupId);
                // Обновляем список после удаления
                setTimeout(() => {
                    forceRefresh();
                }, 300);
            } catch (error) {
                console.error('Failed to delete group:', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Groups ({groups.length})</h1>
                <div className="flex space-x-3">
                    <Button
                        variant="secondary"
                        onClick={forceRefresh}
                        className="flex items-center"
                        title="Refresh groups"
                    >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Refresh
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Create Group
                    </Button>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    type="search"
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {filteredGroups.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups yet</h3>
                        <p className="text-gray-500 mb-4">Create your first group to start collaborating</p>
                        <Button
                            variant="primary"
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center mx-auto"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Create Group
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGroups.map((group: WorkGroup) => (
                        <Card key={group.id} hover>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">{group.name}</h3>
                                        {group.description && (
                                            <p className="text-gray-600 text-sm mt-1">{group.description}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            Created by {group.creatorUsername}
                                        </p>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex items-center text-sm text-gray-500 mb-4">
                                    <Users className="h-4 w-4 mr-1" />
                                    <span className="mr-4">Members: {group.memberCount || 0}</span>
                                    <FileText className="h-4 w-4 mr-1" />
                                    <span>Files: {group.fileCount || 0}</span>
                                </div>

                                <div className="flex space-x-2">
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={() => navigate(`/groups/${group.id}`)}
                                    >
                                        Open
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleDeleteGroup(group.id)}
                                        loading={deleteGroupMutation.isPending}
                                        disabled={deleteGroupMutation.isPending}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Модалка создания группы */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Group</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Group Name *
                                </label>
                                <input
                                    type="text"
                                    className={`w-full px-4 py-2 border ${
                                        errors.name ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400`}
                                    placeholder="Enter group name"
                                    {...register('name')}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                                    placeholder="Enter group description"
                                    rows={3}
                                    {...register('description')}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        reset();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={createGroupMutation.isPending}
                                    disabled={createGroupMutation.isPending}
                                >
                                    {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;