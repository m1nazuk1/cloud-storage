import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';
import { notificationApi } from '../api/notifications';
import { Notification } from '../types';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHero from '../components/ui/PageHero';
import { formatDate } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { filterNotifications, type NotificationGroupFilter, } from '../utils/notificationFilters';
const Notifications: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const uid = user?.id;
    const [notifFilter, setNotifFilter] = useState<NotificationGroupFilter>('all');
    const NOTIF_FILTER_OPTIONS = useMemo(() => [
        { id: 'all' as const, label: t('notifications.filter.all') },
        { id: 'files' as const, label: t('notifications.filter.files') },
        { id: 'members' as const, label: t('notifications.filter.members') },
        { id: 'group' as const, label: t('notifications.filter.group') },
        { id: 'chat' as const, label: t('notifications.filter.chat') },
    ], [t]);
    const { data: items = [], isLoading, error } = useQuery({
        queryKey: ['notifications', uid],
        queryFn: notificationApi.getAll,
        enabled: !!uid,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });
    const markRead = useMutation({
        mutationFn: notificationApi.markAsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });
    const markAll = useMutation({
        mutationFn: notificationApi.markAllAsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });
    const typeLabel = (type: Notification['type']) => t(`notifications.type.${type}`, { defaultValue: type });
    if (isLoading) {
        return (<div className="flex justify-center items-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400"/>
            </div>);
    }
    if (error) {
        return (<div className="text-center py-12 text-red-600 dark:text-red-400">
                {t('notifications.loadError')}
            </div>);
    }
    const unread = items.filter((n) => !n.read).length;
    const filteredItems = useMemo(() => filterNotifications(items, notifFilter), [items, notifFilter]);
    return (<div className="space-y-6 min-w-0">
            <PageHero badge={t('notifications.badge')} title={<span className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <Bell className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 opacity-95"/>
                        {t('notifications.title')}
                    </span>} subtitle={unread > 0 ? t('notifications.unreadCount', { count: unread }) : t('notifications.allRead')}>
                {items.length > 0 && unread > 0 && (<Button variant="secondary" onClick={() => markAll.mutate()} disabled={markAll.isPending} className="w-full justify-center sm:w-auto flex items-center gap-2 bg-white/95 text-indigo-900 border-white/50 dark:bg-slate-800/95 dark:text-slate-100 dark:border-slate-600">
                        <CheckCheck className="h-4 w-4"/>
                        {t('notifications.markAll')}
                    </Button>)}
            </PageHero>

            {items.length === 0 ? (<Card>
                    <CardContent className="py-16 text-center text-gray-500 dark:text-slate-400">
                        {t('notifications.empty')}
                    </CardContent>
                </Card>) : (<div className="space-y-4 min-w-0">
                    <div className="flex flex-wrap gap-2">
                        {NOTIF_FILTER_OPTIONS.map((opt) => {
                const active = notifFilter === opt.id;
                return (<button key={opt.id} type="button" onClick={() => setNotifFilter(opt.id)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${active
                        ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}>
                                    {opt.label}
                                </button>);
            })}
                    </div>
                    {notifFilter !== 'all' && (<p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('notifications.shown', { shown: filteredItems.length, total: items.length })}
                        </p>)}
                    {filteredItems.length === 0 ? (<Card>
                            <CardContent className="py-12 text-center text-slate-600 dark:text-slate-300">
                                <p className="text-sm">{t('notifications.noneInCategory')}</p>
                                <button type="button" className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400" onClick={() => setNotifFilter('all')}>
                                    {t('notifications.showAll')}
                                </button>
                            </CardContent>
                        </Card>) : (<div className="space-y-3">
                    {filteredItems.map((n) => (<Card key={n.id} className={!n.read
                        ? 'border-l-4 border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/35 dark:border-indigo-400'
                        : ''}>
                            <CardHeader className="pb-2">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                                        {typeLabel(n.type)}
                                    </span>
                                    <span>·</span>
                                    <time>{formatDate(n.createdDate)}</time>
                                    {n.group?.id && (<>
                                            <span>·</span>
                                            <Link to={`/groups/${n.group.id}`} className="inline-flex items-center gap-1 text-indigo-600 hover:text-violet-700 dark:text-indigo-400 dark:hover:text-violet-300 font-medium">
                                                {n.group.name || t('notifications.groupFallback')}
                                                <ExternalLink className="h-3 w-3"/>
                                            </Link>
                                            {(n.type === 'CHAT_MENTION' || n.type === 'CHAT_REPLY') && (<>
                                                    <span>·</span>
                                                    <Link to={`/chat/${n.group.id}`} className="inline-flex items-center gap-1 text-violet-600 hover:text-indigo-700 dark:text-violet-400 dark:hover:text-indigo-300 font-medium">
                                                        {t('notifications.openChat')}
                                                        <ExternalLink className="h-3 w-3"/>
                                                    </Link>
                                                </>)}
                                        </>)}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-gray-900 dark:text-slate-100">{n.message}</p>
                                {!n.read && (<Button variant="ghost" size="sm" className="mt-3" onClick={() => markRead.mutate(n.id)} disabled={markRead.isPending}>
                                        {t('notifications.markRead')}
                                    </Button>)}
                            </CardContent>
                        </Card>))}
                </div>)}
                </div>)}
        </div>);
};
export default Notifications;
