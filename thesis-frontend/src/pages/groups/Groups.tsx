import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Plus,
    Search,
    Users,
    FileText,
    MoreVertical,
    Folder,
    RefreshCw,
    Bell,
    BellOff,
    Pin,
    PinOff,
    Palette,
    X,
} from 'lucide-react';
import { useGroups, useCreateGroup, useDeleteGroup, useUpdateGroupMembershipPrefs } from '../../hooks/useGroups';
import { groupCreateSchema } from '../../utils/validation';
import { WorkGroup } from '../../types';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PageHero from '../../components/ui/PageHero';
import { useToast } from '../../contexts/ToastContext';
import type { GroupMembershipPrefs } from '../../api/group';

const ACCENT_PRESETS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#22c55e', '#eab308', '#64748b'];

type GroupFormData = {
    name: string;
    description?: string;
};

const Groups: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const { groups, isLoading, forceRefresh } = useGroups();
    const createGroupMutation = useCreateGroup();
    const deleteGroupMutation = useDeleteGroup();
    const prefsMutation = useUpdateGroupMembershipPrefs();
    const navigate = useNavigate();
    const toast = useToast();
    const menuContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const q = searchParams.get('q');
        if (q) {
            setSearchQuery(q);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!menuOpenId) return;
        const handle = (e: MouseEvent) => {
            const el = menuContainerRef.current;
            if (el && !el.contains(e.target as Node)) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [menuOpenId]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<GroupFormData>({
        resolver: zodResolver(groupCreateSchema),
        mode: 'onTouched',
    });

    const onSubmit = async (data: GroupFormData) => {
        try {
            await createGroupMutation.mutateAsync(data);
            reset();
            setShowCreateModal(false);
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
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent" />
            </div>
        );
    }

    if (!Array.isArray(groups)) {
        console.error('Groups is not an array:', groups);
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-xl mb-4">⚠️ Ошибка данных</div>
                <p className="text-gray-600 dark:text-slate-400 mb-4">Не удалось загрузить группы. Обновите страницу.</p>
                <Button variant="primary" onClick={() => window.location.reload()}>
                    Обновить страницу
                </Button>
            </div>
        );
    }

    const filteredGroups = [...groups]
        .filter(
            (group) =>
                group &&
                group.name &&
                (group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    group.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
            const pa = a.pinned ? 1 : 0;
            const pb = b.pinned ? 1 : 0;
            if (pb !== pa) return pb - pa;
            return a.name.localeCompare(b.name, 'ru');
        });

    const handleDeleteGroup = async (groupId: string) => {
        if (window.confirm('Удалить эту группу?')) {
            try {
                await deleteGroupMutation.mutateAsync(groupId);
                setTimeout(() => {
                    forceRefresh();
                }, 300);
            } catch (error) {
                console.error('Failed to delete group:', error);
            }
        }
    };

    const runPrefs = (prefs: { groupId: string } & GroupMembershipPrefs, okMsg?: string) => {
        prefsMutation.mutate(prefs, {
            onSuccess: () => {
                if (okMsg) toast.success(okMsg);
                setMenuOpenId(null);
            },
        });
    };

    return (
        <div className="space-y-6 min-w-0" ref={menuContainerRef}>
            <PageHero
                badge="Совместная работа"
                title={`Группы (${groups.length})`}
                subtitle="Создавайте пространства для файлов и чата, приглашайте участников."
            >
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:w-auto">
                    <Button
                        variant="secondary"
                        onClick={forceRefresh}
                        className="w-full justify-center sm:w-auto flex items-center bg-white/95 text-indigo-900 border-white/50 dark:bg-slate-800/95 dark:text-slate-100 dark:border-slate-600"
                        title="Обновить список"
                    >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Обновить
                    </Button>
                    <Button variant="primary" onClick={() => setShowCreateModal(true)} className="flex items-center shadow-lg">
                        <Plus className="mr-2 h-5 w-5" />
                        Создать группу
                    </Button>
                </div>
            </PageHero>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <Input
                    type="search"
                    placeholder="Поиск по группам…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 dark:bg-slate-800/80 dark:border-slate-600 dark:text-slate-100"
                />
            </div>

            {filteredGroups.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Folder className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Пока нет групп</h3>
                        <p className="text-gray-500 dark:text-slate-400 mb-4">Создайте первую группу для совместной работы</p>
                        <Button
                            variant="primary"
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center mx-auto"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Создать группу
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGroups.map((group: WorkGroup) => {
                        const accent = group.accentColor?.trim();
                        const borderStyle = accent
                            ? { borderColor: accent, borderWidth: 2, borderStyle: 'solid' as const }
                            : undefined;
                        return (
                            <Card
                                key={group.id}
                                hover
                                className={`${accent ? 'border-2' : ''} animate-fade-in motion-reduce:animate-none`}
                                style={borderStyle}
                            >
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4 gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                {group.pinned && (
                                                    <span title="Закреплено" className="inline-flex">
                                                        <Pin className="h-4 w-4 text-amber-500 shrink-0" aria-hidden />
                                                    </span>
                                                )}
                                                <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-lg truncate">
                                                    {group.name}
                                                </h3>
                                            </div>
                                            {group.description && (
                                                <p className="text-gray-600 dark:text-slate-400 text-sm mt-1 line-clamp-2">
                                                    {group.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                                Создал(а): {group.creatorUsername}
                                            </p>
                                            {group.notificationsMuted && (
                                                <p className="text-xs text-amber-700 dark:text-amber-400/90 mt-1 flex items-center gap-1">
                                                    <BellOff className="h-3.5 w-3.5" />
                                                    Уведомления группы отключены
                                                </p>
                                            )}
                                        </div>
                                        <div className="relative shrink-0">
                                            <button
                                                type="button"
                                                className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 dark:hover:text-indigo-300 transition-all duration-200 hover:scale-110 active:scale-95"
                                                aria-expanded={menuOpenId === group.id}
                                                aria-haspopup="true"
                                                onClick={() =>
                                                    setMenuOpenId((id) => (id === group.id ? null : group.id))
                                                }
                                            >
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                            {menuOpenId === group.id && (
                                                <div
                                                    className="absolute right-0 top-9 z-40 w-[15.5rem] rounded-2xl border-2 border-indigo-200/95 dark:border-indigo-500/35 bg-gradient-to-b from-white via-indigo-50/50 to-white dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 py-2 text-sm shadow-[0_22px_50px_-12px_rgba(79,70,229,0.32)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.78)] ring-1 ring-indigo-300/50 dark:ring-indigo-400/15 backdrop-blur-md animate-popover-in motion-reduce:animate-none"
                                                    role="menu"
                                                >
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="w-full px-3 py-2.5 text-left flex items-center gap-2 rounded-lg mx-1 hover:bg-indigo-100/90 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors duration-150"
                                                        onClick={() =>
                                                            runPrefs(
                                                                {
                                                                    groupId: group.id,
                                                                    notificationsMuted: !group.notificationsMuted,
                                                                },
                                                                group.notificationsMuted
                                                                    ? 'Уведомления включены'
                                                                    : 'Уведомления отключены для группы'
                                                            )
                                                        }
                                                        disabled={prefsMutation.isPending}
                                                    >
                                                        {group.notificationsMuted ? (
                                                            <>
                                                                <Bell className="h-4 w-4 text-indigo-500" />
                                                                Включить уведомления
                                                            </>
                                                        ) : (
                                                            <>
                                                                <BellOff className="h-4 w-4 text-amber-600" />
                                                                Отключить уведомления
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="w-full px-3 py-2.5 text-left flex items-center gap-2 rounded-lg mx-1 hover:bg-indigo-100/90 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors duration-150"
                                                        onClick={() =>
                                                            runPrefs(
                                                                { groupId: group.id, pinned: !group.pinned },
                                                                group.pinned ? 'Группа откреплена' : 'Группа закреплена'
                                                            )
                                                        }
                                                        disabled={prefsMutation.isPending}
                                                    >
                                                        {group.pinned ? (
                                                            <>
                                                                <PinOff className="h-4 w-4" />
                                                                Открепить
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Pin className="h-4 w-4 text-amber-500" />
                                                                Закрепить группу
                                                            </>
                                                        )}
                                                    </button>
                                                    <div className="border-t border-indigo-100/90 dark:border-slate-700 my-2 mx-2" />
                                                    <div className="px-3 py-1.5 text-xs font-semibold text-indigo-700/90 dark:text-slate-400 flex items-center gap-1.5">
                                                        <Palette className="h-3.5 w-3.5" />
                                                        Цвет контура
                                                    </div>
                                                    <div className="px-2 pb-2 flex flex-wrap gap-1.5">
                                                        {ACCENT_PRESETS.map((c) => (
                                                            <button
                                                                key={c}
                                                                type="button"
                                                                title={c}
                                                                className="h-7 w-7 rounded-lg border-2 border-white dark:border-slate-600 shadow-sm ring-2 ring-transparent hover:ring-indigo-400/50 hover:scale-110 transition-transform"
                                                                style={{ backgroundColor: c }}
                                                                onClick={() =>
                                                                    runPrefs({ groupId: group.id, accentColor: c }, 'Цвет сохранён')
                                                                }
                                                                disabled={prefsMutation.isPending}
                                                            />
                                                        ))}
                                                        <button
                                                            type="button"
                                                            title="Сбросить цвет"
                                                            className="h-7 w-7 rounded-lg border border-dashed border-slate-300 dark:border-slate-500 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-110 transition-transform"
                                                            onClick={() =>
                                                                runPrefs({ groupId: group.id, accentColor: '' }, 'Контур сброшен')
                                                            }
                                                            disabled={prefsMutation.isPending}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 mb-4">
                                        <Users className="h-4 w-4 mr-1" />
                                        <span className="mr-4">Участников: {group.memberCount || 0}</span>
                                        <FileText className="h-4 w-4 mr-1" />
                                        <span>Файлов: {group.fileCount || 0}</span>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-0 sm:space-x-2">
                                        <Button
                                            variant="primary"
                                            className="flex-1 w-full sm:w-auto"
                                            onClick={() => navigate(`/groups/${group.id}`)}
                                        >
                                            Открыть
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full sm:w-auto"
                                            onClick={() => handleDeleteGroup(group.id)}
                                            loading={deleteGroupMutation.isPending}
                                            disabled={deleteGroupMutation.isPending}
                                        >
                                            Удалить
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto overscroll-contain">
                    <div className="glass-panel max-w-md w-full rounded-t-2xl sm:rounded-2xl p-5 sm:p-8 border border-white/60 dark:border-slate-600 dark:bg-slate-800/95 mb-0 sm:mb-auto max-h-[min(92dvh,640px)] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Новая группа</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Название *
                                </label>
                                <input
                                    type="text"
                                    className={`w-full px-4 py-2 border ${
                                        errors.name ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 dark:bg-slate-900/50 dark:text-slate-100`}
                                    placeholder="Название группы"
                                    {...register('name')}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Описание (необязательно)
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                                    placeholder="Краткое описание"
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
                                    Отмена
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={createGroupMutation.isPending}
                                    disabled={createGroupMutation.isPending}
                                >
                                    {createGroupMutation.isPending ? 'Создание…' : 'Создать'}
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
