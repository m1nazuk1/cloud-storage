import React from 'react';
import { Link } from 'react-router-dom';
import {
    Folder,
    FileText,
    Clock,
    HardDrive,
    Upload,
    Download,
    Trash2,
    Edit,
    Bell,
    ArrowRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity';
import { statsApi } from '../api/stats';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHero from '../components/ui/PageHero';
import { formatRelativeTime, formatFileSize } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const uid = user?.id;

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['user-stats', uid],
        queryFn: statsApi.getUserStats,
        enabled: !!uid,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    const { data: activities = [], isLoading: activitiesLoading } = useQuery({
        queryKey: ['recent-activity', uid],
        queryFn: activityApi.getRecentActivity,
        enabled: !!uid,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'UPLOADED':
                return (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/45 dark:text-emerald-300">
                        <Upload className="h-4 w-4" />
                    </span>
                );
            case 'DELETED':
                return (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
                        <Trash2 className="h-4 w-4" />
                    </span>
                );
            case 'DOWNLOADED':
                return (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/45 dark:text-sky-300">
                        <Download className="h-4 w-4" />
                    </span>
                );
            case 'RENAMED':
                return (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                        <Edit className="h-4 w-4" />
                    </span>
                );
            default:
                return (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                        <Clock className="h-4 w-4" />
                    </span>
                );
        }
    };

    if (statsLoading || activitiesLoading) {
        return (
            <div className="flex justify-center items-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent" />
            </div>
        );
    }

    const unread = stats?.unreadNotifications ?? 0;

    const statCards = [
        {
            label: 'Групп',
            value: stats?.totalGroups ?? 0,
            hint: 'в которых вы участник',
            icon: Folder,
            iconBg: 'bg-primary-100 text-primary-700 dark:bg-indigo-900/50 dark:text-indigo-300',
            link: '/groups',
            linkLabel: 'Открыть группы',
        },
        {
            label: 'Файлов',
            value: stats?.totalFiles ?? 0,
            hint: 'во всех ваших группах',
            icon: FileText,
            iconBg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/45 dark:text-violet-300',
            link: '/groups',
            linkLabel: 'К файлам',
        },
        {
            label: 'Ваши загрузки',
            value: stats?.totalStorageUsed ? formatFileSize(stats.totalStorageUsed) : '0 Б',
            hint: 'суммарный объём загруженных файлов',
            icon: HardDrive,
            iconBg: 'bg-teal-100 text-teal-700 dark:bg-teal-900/45 dark:text-teal-300',
            link: '/groups',
            linkLabel: 'Перейти',
        },
        {
            label: 'Уведомления',
            value: unread > 0 ? unread : '—',
            hint: unread > 0 ? 'непрочитанных' : 'всё прочитано',
            icon: Bell,
            iconBg: unread > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
            link: '/notifications',
            linkLabel: 'К уведомлениям',
        },
    ];

    return (
        <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto min-w-0">
            <PageHero
                badge="Облачное хранилище"
                title={
                    user?.username ? (
                        <>Здравствуйте, {user.username}</>
                    ) : (
                        <>Главная</>
                    )
                }
                subtitle="Краткая сводка по группам и файлам. Недавние действия — ниже."
            >
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:w-auto">
                    <Link to="/groups" className="w-full sm:w-auto">
                        <Button
                            variant="secondary"
                            className="w-full justify-center sm:w-auto bg-white/95 text-indigo-900 hover:bg-white border-0 shadow-md dark:bg-slate-800/95 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            Мои группы
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link to="/notifications" className="w-full sm:w-auto">
                        <Button variant="ghost" className="w-full justify-center sm:w-auto text-white border border-white/35 hover:bg-white/15">
                            <Bell className="mr-2 h-4 w-4" />
                            Уведомления
                        </Button>
                    </Link>
                </div>
            </PageHero>

            {/* Метрики */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <Link
                        key={card.label}
                        to={card.link}
                        className="group block rounded-2xl border border-slate-200/90 dark:border-slate-600/80 bg-white/95 dark:bg-slate-800/90 p-5 shadow-md shadow-slate-900/5 dark:shadow-black/20 transition hover:border-indigo-200/80 dark:hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-950/10"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg}`}
                            >
                                <card.icon className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                {card.linkLabel}
                                <ArrowRight className="h-3 w-3" />
                            </span>
                        </div>
                        <p className="mt-4 text-sm font-medium text-gray-500 dark:text-slate-400">{card.label}</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-50 tabular-nums">{card.value}</p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">{card.hint}</p>
                    </Link>
                ))}
            </div>

            {/* Недавняя активность — на всю ширину */}
            <Card className="overflow-hidden border-slate-200/80 shadow-md" hover={false}>
                <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50/90 to-indigo-50/40 dark:from-slate-800/80 dark:to-indigo-950/40">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Недавняя активность</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                                Загрузки, удаления и переименования в ваших группах
                            </p>
                        </div>
                        <Link to="/groups" className="text-sm font-semibold text-indigo-600 hover:text-violet-700 dark:text-indigo-400 dark:hover:text-violet-300">
                            Все группы →
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {activities.length > 0 ? (
                        <ul className="divide-y divide-slate-100">
                            {activities.map((activity) => (
                                <li
                                    key={activity.id}
                                    className="px-4 sm:px-6 py-4 hover:bg-indigo-50/40 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 pt-0.5">{getActivityIcon(activity.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 dark:text-slate-100 leading-relaxed">{activity.message}</p>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-gray-500 dark:text-slate-400">
                                                <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-slate-700 px-2 py-0.5 font-medium text-gray-700 dark:text-slate-200">
                                                    {activity.groupName}
                                                </span>
                                                <span className="text-gray-300">·</span>
                                                <span>{formatRelativeTime(activity.createdDate)}</span>
                                                {activity.groupId && (
                                                    <>
                                                        <span className="text-gray-300">·</span>
                                                        <Link
                                                            to={`/groups/${activity.groupId}`}
                                                            className="text-indigo-600 hover:text-violet-800 dark:text-indigo-400 dark:hover:text-violet-300 font-semibold"
                                                        >
                                                            Открыть группу
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-16 px-4">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 mb-4">
                                <Clock className="h-8 w-8" />
                            </div>
                            <p className="text-gray-700 dark:text-slate-200 font-medium">Пока нет активности</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                Когда участники групп будут работать с файлами, события появятся здесь.
                            </p>
                            <Link to="/groups" className="inline-block mt-6">
                                <Button variant="primary" size="sm">
                                    Перейти к группам
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
