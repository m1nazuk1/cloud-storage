import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Upload,
    Download,
    Trash2,
    Users,
    FileText,
    MessageSquare,
    Settings, Plus
} from 'lucide-react';
import { groupApi } from '../../api/group';
import { fileApi } from '../../api/file';
import { useUploadFile, useDeleteFile } from '../../hooks/useFiles';
import { formatFileSize, formatDate, getFileIcon } from '../../utils/format';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const GroupDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { data: group, isLoading: groupLoading, error: groupError } = useQuery({
        queryKey: ['group', id],
        queryFn: () => groupApi.getGroup(id!),
        enabled: !!id,
    });

    const { data: members = [] } = useQuery({
        queryKey: ['group', id, 'members'],
        queryFn: () => groupApi.getGroupMembers(id!),
        enabled: !!id,
    });

    const { data: files = [], isLoading: filesLoading, refetch: refetchFiles } = useQuery({
        queryKey: ['files', id],
        queryFn: () => fileApi.getGroupFiles(id!),
        enabled: !!id,
    });

    const uploadFileMutation = useUploadFile(id!);
    const deleteFileMutation = useDeleteFile();

    const handleFileUpload = async () => {
        if (selectedFile) {
            try {
                await uploadFileMutation.mutateAsync(selectedFile);
                setSelectedFile(null);
                refetchFiles();
            } catch (error) {
                console.error('Upload failed:', error);
            }
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
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            try {
                await deleteFileMutation.mutateAsync(fileId);
                refetchFiles();
            } catch (error) {
                console.error('Delete failed:', error);
            }
        }
    };

    if (groupLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (groupError || !group) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Group not found</h2>
                <Button variant="primary" onClick={() => navigate('/groups')}>
                    Back to Groups
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                    {group.description && (
                        <p className="text-gray-600 mt-1">{group.description}</p>
                    )}
                </div>
                <div className="flex space-x-3">
                    <Button variant="secondary" className="flex items-center">
                        <Settings className="mr-2 h-5 w-5" />
                        Settings
                    </Button>
                    <Button variant="primary" className="flex items-center">
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Open Chat
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Files */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Files</h3>
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <label htmlFor="file-upload">
                                            <Button variant="secondary" className="flex items-center cursor-pointer">
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
                                            className="flex items-center"
                                            disabled={uploadFileMutation.isPending}
                                        >
                                            Upload {selectedFile.name}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filesLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="loading-spinner"></div>
                                </div>
                            ) : files.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No files uploaded yet</p>
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

                {/* Right column - Members & Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900">Group Members</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-primary-600" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">{member.username}</p>
                                            <p className="text-xs text-gray-500">{member.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" fullWidth className="mt-4">
                                <Plus className="mr-2 h-5 w-5" />
                                Invite Members
                            </Button>
                        </CardContent>
                    </Card>

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
                                    <p className="text-sm text-gray-900">{group.creator?.username || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Files</p>
                                    <p className="text-sm text-gray-900">{files.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Members</p>
                                    <p className="text-sm text-gray-900">{members.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default GroupDetail;