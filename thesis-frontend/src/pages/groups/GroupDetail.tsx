import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Upload,
    Download,
    Trash2,
    Users,
    FileText,
    MessageSquare,
    Settings,
    Plus,
    Copy,
    Share2,
    X
} from 'lucide-react';
import { groupApi } from '../../api/group';
import { fileApi } from '../../api/file';
import { useUploadFile, useDeleteFile } from '../../hooks/useFiles';
import { formatFileSize, formatDate, getFileIcon } from '../../utils/format';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { FileMetadata } from '../../types';

const GroupDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { success, error } = useToast();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [stats, setStats] = useState({
        memberCount: 0,
        fileCount: 0
    });

    // Получаем данные группы
    const {
        data: group,
        isLoading: groupLoading,
        error: groupError,
        refetch: refetchGroup
    } = useQuery({
        queryKey: ['group', id],
        queryFn: () => groupApi.getGroup(id!),
        enabled: !!id,

    });

    // Получаем участников группы
    const {
        data: membersData = [],
        isLoading: membersLoading,
        refetch: refetchMembers
    } = useQuery({
        queryKey: ['group', id, 'members'],
        queryFn: () => groupApi.getGroupMembers(id!),
        enabled: !!id,

    });

    // Получаем файлы группы
    const {
        data: filesData,
        isLoading: filesLoading,
        refetch: refetchFiles
    } = useQuery({
        queryKey: ['files', id],
        queryFn: (): Promise<FileMetadata[]> => fileApi.getGroupFiles(id!),
        enabled: !!id,

    });

    const uploadFileMutation = useUploadFile(id!);
    const deleteFileMutation = useDeleteFile();

    // Преобразуем данные в массивы
    const files = Array.isArray(filesData) ? filesData : [];
    const members = Array.isArray(membersData) ? membersData : [];

    // Инициализируем статистику при загрузке данных
    useEffect(() => {
        if (members.length > 0 || files.length > 0) {
            setStats({
                memberCount: members.length,
                fileCount: files.length
            });
        }
    }, [members, files]);

    const handleFileUpload = async () => {
        if (!selectedFile) return;

        try {
            await uploadFileMutation.mutateAsync(selectedFile);
            setSelectedFile(null);

            // Обновляем данные после загрузки файла
            await Promise.all([
                refetchFiles(),
                refetchMembers()
            ]);

            success('File uploaded successfully!');
        } catch (err: any) {
            console.error('Upload failed:', err);
            error(err.response?.data?.message || 'Failed to upload file');
        }
    };

    const handleDownload = async (fileId: string, fileName: string) => {
        try {
            const blob = await fileApi.downloadFile(fileId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            success('File downloaded successfully!');
        } catch (err: any) {
            console.error('Download failed:', err);
            error(err.response?.data?.message || 'Failed to download file');
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            try {
                await deleteFileMutation.mutateAsync(fileId);
                await refetchFiles();
                success('File deleted successfully!');
            } catch (err: any) {
                console.error('Delete failed:', err);
                error(err.response?.data?.message || 'Failed to delete file');
            }
        }
    };

    const handleGenerateInviteLink = async () => {
        if (!id) return;

        try {
            const response = await groupApi.getInviteToken(id);
            const token = response.token;
            const link = `${window.location.origin}/join/${token}`;
            setInviteLink(link);
            success('Invite link generated!');
        } catch (err: any) {
            console.error('Failed to generate invite token:', err);
            error(err.response?.data?.message || 'Failed to generate invite link');
        }
    };

    const handleCopyInviteLink = () => {
        if (!inviteLink) return;

        navigator.clipboard.writeText(inviteLink)
            .then(() => success('Invite link copied to clipboard!'))
            .catch(() => error('Failed to copy link'));
    };

    const handleOpenChat = () => {
        if (!id) return;
        navigate(`/chat/${id}`);
    };

    const handleSaveSettings = async () => {
        if (!id) return;

        try {
            await groupApi.updateGroup(id, {
                name: groupName,
                description: groupDescription,
                regenerateToken: false
            });
            await refetchGroup();
            setShowSettingsModal(false);
            success('Group settings updated successfully');
        } catch (err: any) {
            console.error('Failed to update group:', err);
            error(err.response?.data?.message || 'Failed to update group settings');
        }
    };

    const handleInviteMembers = () => {
        setShowInviteModal(true);
        handleGenerateInviteLink();
    };

    // Показать загрузку
    if (groupLoading || membersLoading || filesLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    // Показать ошибку
    if (groupError || !group) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Group not found</h2>
                <p className="text-gray-600 mb-4">The group you're looking for doesn't exist or you don't have access to it.</p>
                <Button variant="primary" onClick={() => navigate('/groups')}>
                    Back to Groups
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                    {group.description && (
                        <p className="text-gray-600 mt-1">{group.description}</p>
                    )}
                </div>
                <div className="flex space-x-3">
                    <Button
                        variant="secondary"
                        className="flex items-center"
                        onClick={() => setShowSettingsModal(true)}
                    >
                        <Settings className="mr-2 h-5 w-5" />
                        Settings
                    </Button>
                    <Button
                        variant="primary"
                        className="flex items-center"
                        onClick={handleOpenChat}
                    >
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Open Chat
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Левая колонка - Файлы */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Files ({stats.fileCount})</h3>
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        />
                                        <label htmlFor="file-upload">
                                            <Button
                                                variant="secondary"
                                                className="flex items-center cursor-pointer"
                                            >
                                                <Upload className="mr-2 h-5 w-5" />
                                                Choose File
                                            </Button>
                                        </label>
                                    </div>
                                    {selectedFile && (
                                        <Button
                                            variant="primary"
                                            onClick={handleFileUpload}
                                            loading={uploadFileMutation.isPending}
                                            disabled={uploadFileMutation.isPending}
                                            className="flex items-center"
                                        >
                                            Upload {selectedFile.name}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {files.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No files uploaded yet</p>
                                    <p className="text-sm text-gray-400 mt-2">Upload your first file to get started</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Size
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Uploaded
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                        {files.map((file) => (
                                            <tr key={file.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className="text-lg mr-3">{getFileIcon(file.fileType)}</span>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {file.originalName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                by {file.uploader?.username || 'Unknown'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatFileSize(file.fileSize)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(file.uploadDate)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDownload(file.id, file.originalName)}
                                                            className="flex items-center"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteFile(file.id)}
                                                            loading={deleteFileMutation.isPending}
                                                            disabled={deleteFileMutation.isPending}
                                                            className="flex items-center text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Правая колонка - Участники и информация */}
                <div className="space-y-6">
                    {/* Участники группы */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900">Group Members ({stats.memberCount})</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {members.length > 0 ? (
                                    members.map((member) => (
                                        <div key={member.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-primary-600" />
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">{member.username}</p>
                                                <p className="text-xs text-gray-500">{member.email}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500">No members found</p>
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                fullWidth
                                className="mt-4"
                                onClick={handleInviteMembers}
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Invite Members
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Информация о группе */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900">Group Information</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Created</p>
                                    <p className="text-sm text-gray-900">{formatDate(group.creationDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Creator</p>
                                    <p className="text-sm text-gray-900">{group.creatorUsername || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Files</p>
                                    <p className="text-sm text-gray-900">{stats.fileCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Модальное окно приглашения участников */}
            {showInviteModal && (
                <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)}>
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Invite Members</h3>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Share this link with others to invite them to the group:
                                </p>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        readOnly
                                        value={inviteLink || 'Generating link...'}
                                        className="flex-1 font-mono text-sm"
                                    />
                                    <Button
                                        variant="secondary"
                                        onClick={handleCopyInviteLink}
                                        disabled={!inviteLink}
                                        className="flex items-center"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowInviteModal(false)}
                                >
                                    Close
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleGenerateInviteLink}
                                    className="flex items-center"
                                >
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Regenerate Link
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Модальное окно настроек группы */}
            {showSettingsModal && (
                <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)}>
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Group Settings</h3>
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Group Name
                                </label>
                                <Input
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Enter group name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                                    value={groupDescription}
                                    onChange={(e) => setGroupDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Enter group description"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowSettingsModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveSettings}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default GroupDetail;