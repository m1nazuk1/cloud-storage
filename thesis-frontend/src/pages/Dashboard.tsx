import React from 'react';
import { Link } from 'react-router-dom';
import {
    Folder, Users, FileText, Clock, HardDrive, Upload, Download, Trash2, Edit
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity';
import { statsApi } from '../api/stats';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatRelativeTime, formatFileSize } from '../utils/format';

const Dashboard: React.FC = () => {
    // Получаем статистику пользователя
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['user-stats'],
        queryFn: statsApi.getUserStats,
    });

    // Получаем активность
    const { data: activities = [], isLoading: activitiesLoading } = useQuery({
        queryKey: ['recent-activity'],
        queryFn: activityApi.getRecentActivity,
    });

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'UPLOADED': return <Upload className="h-4 w-4 text-green-500" />;
            case 'DELETED': return <Trash2 className="h-4 w-4 text-red-500" />;
            case 'DOWNLOADED': return <Download className="h-4 w-4 text-blue-500" />;
            case 'RENAMED': return <Edit className="h-4 w-4 text-yellow-500" />;
            default: return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    if (statsLoading || activitiesLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <Link to="/groups">
                    <Button variant="primary">
                        Create Group
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card hover>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <Folder className="h-10 w-10 text-primary-500 mb-3" />
                        <h3 className="text-2xl font-bold text-gray-900">
                            {stats?.totalGroups || 0}
                        </h3>
                        <p className="text-gray-500 text-sm">Total Groups</p>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <Users className="h-10 w-10 text-secondary-500 mb-3" />
                        <h3 className="text-2xl font-bold text-gray-900">
                            {stats?.totalMembers || 0}
                        </h3>
                        <p className="text-gray-500 text-sm">Total Members</p>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <FileText className="h-10 w-10 text-accent-500 mb-3" />
                        <h3 className="text-2xl font-bold text-gray-900">
                            {stats?.totalFiles || 0}
                        </h3>
                        <p className="text-gray-500 text-sm">Total Files</p>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <HardDrive className="h-10 w-10 text-green-500 mb-3" />
                        <h3 className="text-2xl font-bold text-gray-900">
                            {stats?.totalStorageUsed ? formatFileSize(stats.totalStorageUsed) : '0 B'}
                        </h3>
                        <p className="text-gray-500 text-sm">Storage Used</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity остается прежним */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                        <Link to="/activity" className="text-sm text-primary-600 hover:text-primary-700">
                            View All
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {activities.length > 0 ? (
                            <div className="space-y-4">
                                {activities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="p-4 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900">
                                                    {activity.message}
                                                </p>
                                                <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                                                    <span>{activity.groupName}</span>
                                                    <span>•</span>
                                                    <span>{formatRelativeTime(activity.createdDate)}</span>
                                                    {activity.fileName && (
                                                        <>
                                                            <span>•</span>
                                                            <Link
                                                                to={`/groups/${activity.groupId}`}
                                                                className="text-primary-600 hover:text-primary-700"
                                                            >
                                                                View
                                                            </Link>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No recent activity</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link to="/groups">
                            <Button variant="secondary" fullWidth className="justify-start">
                                <Folder className="mr-3 h-5 w-5" />
                                Browse Groups
                            </Button>
                        </Link>
                        <Link to="/groups?create=true">
                            <Button variant="primary" fullWidth className="justify-start">
                                <Folder className="mr-3 h-5 w-5" />
                                Create New Group
                            </Button>
                        </Link>
                        {stats && stats.totalFiles > 0 && (
                            <Link to="/files">
                                <Button variant="secondary" fullWidth className="justify-start">
                                    <FileText className="mr-3 h-5 w-5" />
                                    View All Files ({stats.totalFiles})
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;