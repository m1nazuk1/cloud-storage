// import React, { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { Bell, Check} from 'lucide-react';
// import { notificationApi } from '../api/notification';
// import { formatRelativeTime } from '../utils/format';
// import Card, { CardContent } from '../components/ui/Card';
// import Button from '../components/ui/Button';
//
// const Notifications: React.FC = () => {
//     const [filter, setFilter] = useState<'all' | 'unread'>('all');
//     const queryClient = useQueryClient();
//
//     const { data: notifications = [], isLoading } = useQuery({
//         queryKey: ['notifications'],
//         queryFn: notificationApi.getNotifications,
//     });
//
//     const { data: unreadCount } = useQuery({
//         queryKey: ['notifications', 'count'],
//         queryFn: notificationApi.getUnreadCount,
//     });
//
//     const markAsReadMutation = useMutation({
//         mutationFn: notificationApi.markAsRead,
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['notifications'] });
//             queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
//         },
//     });
//
//     const markAllAsReadMutation = useMutation({
//         mutationFn: notificationApi.markAllAsRead,
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['notifications'] });
//             queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
//         },
//     });
//
//     const filteredNotifications = filter === 'unread'
//         ? notifications.filter(n => !n.read)
//         : notifications;
//
//     const handleMarkAllAsRead = () => {
//         markAllAsReadMutation.mutate();
//     };
//
//     const handleMarkAsRead = (notificationId: string) => {
//         markAsReadMutation.mutate(notificationId);
//     };
//
//     if (isLoading) {
//         return (
//             <div className="flex justify-center items-center h-64">
//                 <div className="loading-spinner"></div>
//             </div>
//         );
//     }
//
//     return (
//         <div className="space-y-6">
//             <div className="flex justify-between items-center">
//                 <div>
//                     <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
//                     <p className="text-gray-600">
//                         {unreadCount && unreadCount.count > 0 ? (
//                             <span className="text-primary-600 font-medium">
//                 {unreadCount.count} unread notification{unreadCount.count !== 1 ? 's' : ''}
//               </span>
//                         ) : (
//                             'All caught up!'
//                         )}
//                     </p>
//                 </div>
//
//                 <div className="flex space-x-3">
//                     <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
//                         <button
//                             onClick={() => setFilter('all')}
//                             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
//                                 filter === 'all'
//                                     ? 'bg-white text-gray-900 shadow-sm'
//                                     : 'text-gray-600 hover:text-gray-900'
//                             }`}
//                         >
//                             All
//                         </button>
//                         <button
//                             onClick={() => setFilter('unread')}
//                             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
//                                 filter === 'unread'
//                                     ? 'bg-white text-gray-900 shadow-sm'
//                                     : 'text-gray-600 hover:text-gray-900'
//                             }`}
//                         >
//                             Unread
//                         </button>
//                     </div>
//
//                     {unreadCount && unreadCount.count > 0 && (
//                         <Button
//                             variant="secondary"
//                             onClick={handleMarkAllAsRead}
//                             loading={markAllAsReadMutation.isPending}
//                             className="flex items-center"
//                         >
//                             <Check className="mr-2 h-4 w-4" />
//                             Mark all read
//                         </Button>
//                     )}
//                 </div>
//             </div>
//
//             <Card>
//                 <CardContent className="p-0">
//                     {filteredNotifications.length === 0 ? (
//                         <div className="text-center py-12">
//                             <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
//                             <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                                 {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
//                             </h3>
//                             <p className="text-gray-500">
//                                 {filter === 'unread'
//                                     ? 'You\'re all caught up!'
//                                     : 'Notifications will appear here'}
//                             </p>
//                         </div>
//                     ) : (
//                         <div className="divide-y divide-gray-200">
//                             {filteredNotifications.map((notification) => (
//                                 <div
//                                     key={notification.id}
//                                     className={`p-6 hover:bg-gray-50 transition-colors ${
//                                         !notification.read ? 'bg-blue-50' : ''
//                                     }`}
//                                 >
//                                     <div className="flex items-start justify-between">
//                                         <div className="flex-1">
//                                             <div className="flex items-start space-x-3">
//                                                 <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
//                                                     !notification.read ? 'bg-primary-500' : 'bg-gray-300'
//                                                 }`} />
//                                                 <div className="flex-1">
//                                                     <p className="text-gray-900">{notification.message}</p>
//                                                     <div className="flex items-center mt-2 space-x-4">
//                             <span className="text-xs text-gray-500">
//                               {formatRelativeTime(notification.createdDate)}
//                             </span>
//                                                         <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
//                               {notification.type.replace('_', ' ')}
//                             </span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//
//                                         <div className="flex items-center space-x-2 ml-4">
//                                             {!notification.read && (
//                                                 <button
//                                                     onClick={() => handleMarkAsRead(notification.id)}
//                                                     className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                                                     title="Mark as read"
//                                                 >
//                                                     <Check className="h-4 w-4" />
//                                                 </button>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// };
//
// export default Notifications