import React, { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../../api/notification';
import { formatRelativeTime } from '../../../utils/format';
import Button from '../../ui/Button';

const NotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationApi.getNotifications,
    });

    const { data: unreadCount } = useQuery({
        queryKey: ['notifications', 'count'],
        queryFn: notificationApi.getUnreadCount,
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationApi.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationApi.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
        },
    });

    const handleMarkAsRead = (notificationId: string) => {
        markAsReadMutation.mutate(notificationId);
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const unreadNotifications = notifications.filter(n => !n.read);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
                <Bell className="h-6 w-6" />
                {unreadCount && unreadCount.count > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 z-20">
                        <div className="bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Notifications
                                        {unreadCount && unreadCount.count > 0 && (
                                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                        {unreadCount.count} new
                      </span>
                                        )}
                                    </h3>
                                    {unreadNotifications.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleMarkAllAsRead}
                                            loading={markAllAsReadMutation.isPending}
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Mark all read
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-gray-200">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                                            >
                                                <div className="flex justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-900">{notification.message}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formatRelativeTime(notification.createdDate)}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="ml-2 text-gray-400 hover:text-gray-600"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No notifications yet</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-200">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationDropdown;