import React, { useMemo, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { notificationApi } from '../../../api/notifications';
import { formatRelativeTime } from '../../../utils/format';
import Button from '../../ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { filterNotifications, type NotificationGroupFilter, } from '../../../utils/notificationFilters';
const DROPDOWN_FILTERS: {
    id: NotificationGroupFilter;
    short: string;
}[] = [
    { id: 'all', short: 'Все' },
    { id: 'files', short: 'Файлы' },
    { id: 'members', short: 'Люди' },
    { id: 'group', short: 'Группа' },
    { id: 'chat', short: 'Чат' },
];
const NotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifFilter, setNotifFilter] = useState<NotificationGroupFilter>('all');
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const uid = user?.id;
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', uid],
        queryFn: notificationApi.getNotifications,
        enabled: !!uid,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });
    const { data: unreadCount } = useQuery({
        queryKey: ['notifications', 'count', uid],
        queryFn: notificationApi.getUnreadCount,
        enabled: !!uid,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
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
    const unreadNotifications = notifications.filter((n) => !n.read);
    const filteredNotifications = useMemo(() => filterNotifications(notifications, notifFilter), [notifications, notifFilter]);
    return (<div className="relative">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="relative rounded-xl p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 transition-all duration-200 hover:scale-105 active:scale-95" aria-expanded={isOpen} aria-haspopup="true">
                <Bell className="h-6 w-6"/>
                {(unreadCount?.count ?? 0) > 0 && (<span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 shadow-sm"/>)}
            </button>

            {isOpen && (<>
                    <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none" onClick={() => setIsOpen(false)} aria-hidden/>
                    <div className={'fixed z-50 left-2 right-2 top-[4.75rem] max-h-[min(78vh,32rem)] flex flex-col rounded-2xl border border-white/60 dark:border-slate-600 bg-white/95 dark:bg-slate-900/95 shadow-2xl shadow-indigo-950/20 dark:shadow-black/40 backdrop-blur-xl ring-1 ring-indigo-950/5 dark:ring-slate-700 overflow-hidden ' +
                'sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[min(32rem,calc(100vw-2rem))] sm:max-w-[32rem] sm:top-auto'}>
                        <div className="shrink-0 p-4 border-b border-slate-100/90 dark:border-slate-700 bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/80 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950/80">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-tight">Уведомления</h3>
                                    {unreadCount != null && unreadCount.count > 0 && (<span className="mt-1 inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/55 dark:text-indigo-200">
                                            {unreadCount.count} новых
                                        </span>)}
                                </div>
                                {unreadNotifications.length > 0 && (<Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} loading={markAllAsReadMutation.isPending} className="shrink-0 self-start sm:self-center">
                                        <Check className="h-4 w-4 mr-1"/>
                                        Прочитать все
                                    </Button>)}
                            </div>
                            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                                {DROPDOWN_FILTERS.map((opt) => {
                const active = notifFilter === opt.id;
                return (<button key={opt.id} type="button" onClick={() => setNotifFilter(opt.id)} className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${active
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                                            {opt.short}
                                        </button>);
            })}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            {notifications.length > 0 ? (filteredNotifications.length > 0 ? (<ul className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {filteredNotifications.map((notification) => (<li key={notification.id} className={`px-4 py-3.5 transition-colors sm:px-5 ${!notification.read
                        ? 'bg-indigo-50/70 hover:bg-indigo-50 dark:bg-indigo-950/35 dark:hover:bg-indigo-950/50'
                        : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/70'}`}>
                                            <div className="flex gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-slate-900 dark:text-slate-100 leading-snug break-words">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 tabular-nums">
                                                        {formatRelativeTime(notification.createdDate)}
                                                    </p>
                                                </div>
                                                {!notification.read && (<button type="button" onClick={() => handleMarkAsRead(notification.id)} className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:bg-slate-800 dark:hover:text-indigo-300 dark:hover:border-slate-600 transition-all" title="Отметить прочитанным">
                                                        <Check className="h-4 w-4"/>
                                                    </button>)}
                                            </div>
                                        </li>))}
                                </ul>) : (<div className="p-8 text-center">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">В этой категории пусто</p>
                                        <button type="button" className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400" onClick={() => setNotifFilter('all')}>
                                            Показать все
                                        </button>
                                    </div>)) : (<div className="p-10 text-center">
                                    <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3"/>
                                    <p className="text-slate-600 dark:text-slate-300 font-medium">Пока нет уведомлений</p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">События групп появятся здесь</p>
                                </div>)}
                        </div>

                        <div className="shrink-0 p-4 pb-safe border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 space-y-2">
                            <Link to="/notifications" onClick={() => setIsOpen(false)} className="block w-full text-center text-sm font-semibold text-indigo-600 hover:text-violet-700 dark:text-indigo-400 dark:hover:text-violet-300 transition-colors">
                                Все уведомления
                            </Link>
                            <button type="button" onClick={() => setIsOpen(false)} className="w-full text-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 py-1">
                                Закрыть
                            </button>
                        </div>
                    </div>
                </>)}
        </div>);
};
export default NotificationDropdown;
