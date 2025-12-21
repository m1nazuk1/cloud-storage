import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, Users, FileText, Clock, ArrowRight } from 'lucide-react';
import { useGroups } from '../hooks/useGroups';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../api/notification';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatRelativeTime } from '../utils/format';

const Dashboard: React.FC = () => {
    const { groups, isLoading: groupsLoading } = useGroups();

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationApi.getNotifications,
    });

    const recentGroups = groups.slice(0, 3);
    const recentNotifications = notifications.slice(0, 5);

    if (groupsLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="loading-spinner"></div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card hover>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <Folder className="h-12 w-12 text-primary-500 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">{groups.length}</h3>
                        <p className="text-gray-500">Total Groups</p>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <Users className="h-12 w-12 text-secondary-500 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            {groups.reduce((acc, group) => acc + group.memberCount, 0)}
                        </h3>
                        <p className="text-gray-500">Total Members</p>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-12 w-12 text-accent-500 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            {groups.reduce((acc, group) => acc + group.fileCount, 0)}
                        </h3>
                        <p className="text-gray-500">Total Files</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900">Recent Groups</h3>
                    </CardHeader>
                    <CardContent>
                        {recentGroups.length > 0 ? (
                            <div className="space-y-4">
                                {recentGroups.map((group) => (
                                    <Link
                                        key={group.id}
                                        to={`/groups/${group.id}`}
                                        className="block p-4 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{group.name}</h4>
                                                <p className="text-sm text-gray-500">
                                                    {group.memberCount} members • {group.fileCount} files
                                                </p>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No groups yet</p>
                                <Link to="/groups" className="mt-2 inline-block text-primary-600 hover:text-primary-700">
                                    Create your first group
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    </CardHeader>
                    <CardContent>
                        {recentNotifications.length > 0 ? (
                            <div className="space-y-4">
                                {recentNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 rounded-lg ${!notification.read ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="flex items-start">
                                            <Clock className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900">{notification.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatRelativeTime(notification.createdDate)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No recent activity</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;