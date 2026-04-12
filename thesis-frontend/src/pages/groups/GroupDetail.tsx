import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
    X,
    Pencil,
    Search,
    Filter,
    Image as ImageIcon,
    Code2,
    Film,
    Archive,
    MoreHorizontal,
} from 'lucide-react';
import { groupApi } from '../../api/group';
import { fileApi } from '../../api/file';
import { useUploadFile, useDeleteFile } from '../../hooks/useFiles';
import { formatFileSize, formatDate, formatRelativeTime, getFileIcon, formatUserListSubtitle } from '../../utils/format';
import { getApiErrorMessage } from '../../api/axios';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import PageHero from '../../components/ui/PageHero';
import { useToast } from '../../contexts/ToastContext';
import { FileMetadata, User } from '../../types';
import { userApi } from '../../api/user';
import { useAuth } from '../../contexts/AuthContext';
import {
    filterGroupFiles,
    type NonAllCategory,
} from '../../utils/fileCategories';

function ruParticipantsCount(n: number): string {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return `${n} участник`;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return `${n} участника`;
    return `${n} участников`;
}

const CATEGORY_OPTIONS: {
    id: NonAllCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}[] = [
    { id: 'images', label: 'Картинки', icon: ImageIcon },
    { id: 'documents', label: 'Документы', icon: FileText },
    { id: 'code', label: 'Код', icon: Code2 },
    { id: 'media', label: 'Аудио и видео', icon: Film },
    { id: 'archives', label: 'Архивы', icon: Archive },
    { id: 'other', label: 'Прочее', icon: MoreHorizontal },
];

const GroupDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
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

    const [inviteQuery, setInviteQuery] = useState('');
    const [inviteResults, setInviteResults] = useState<User[]>([]);
    const [inviteSearchLoading, setInviteSearchLoading] = useState(false);
    const [addingUserId, setAddingUserId] = useState<string | null>(null);

    const [renameTarget, setRenameTarget] = useState<FileMetadata | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [renaming, setRenaming] = useState(false);

    /** Пустой Set = все типы файлов */
    const [selectedCategories, setSelectedCategories] = useState<Set<NonAllCategory>>(() => new Set());
    /** Пустой Set = все участники */
    const [selectedUploaderIds, setSelectedUploaderIds] = useState<Set<string>>(() => new Set());
    const [fileSearchQuery, setFileSearchQuery] = useState('');

    const toggleCategory = useCallback((id: NonAllCategory) => {
        setSelectedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleUploader = useCallback((userId: string) => {
        setSelectedUploaderIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    }, []);

    const clearFileFilters = useCallback(() => {
        setSelectedCategories(new Set());
        setSelectedUploaderIds(new Set());
        setFileSearchQuery('');
    }, []);

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

    const { data: storageSettings } = useQuery({
        queryKey: ['storage-settings'],
        queryFn: () => fileApi.getStorageSettings(),
        staleTime: 120_000,
    });

    const uploadFileMutation = useUploadFile(id!);
    const deleteFileMutation = useDeleteFile();

    // Преобразуем данные в массивы
    const files = Array.isArray(filesData) ? filesData : [];
    const members = Array.isArray(membersData) ? membersData : [];

    const filteredFiles = useMemo(
        () => filterGroupFiles(files, selectedCategories, selectedUploaderIds, fileSearchQuery),
        [files, selectedCategories, selectedUploaderIds, fileSearchQuery]
    );

    const filterSummaryParts = useMemo(() => {
        const parts: string[] = [];
        if (selectedCategories.size > 0) {
            const labels = CATEGORY_OPTIONS.filter((o) => selectedCategories.has(o.id)).map((o) => o.label);
            if (labels.length) parts.push(labels.join(', '));
        }
        if (selectedUploaderIds.size > 0) {
            parts.push(ruParticipantsCount(selectedUploaderIds.size));
        }
        return parts;
    }, [selectedCategories, selectedUploaderIds]);

    /** Участники группы + авторы из файлов (если /members пустой или без части людей) */
    const uploadFilterRows = useMemo(() => {
        type Row = { id: string; username: string; email?: string };
        const map = new Map<string, Row>();
        for (const m of members) {
            const sid = String(m.id);
            map.set(sid, { id: sid, username: m.username || '—', email: m.email });
        }
        for (const f of files) {
            const u = f.uploader;
            if (u?.id != null && String(u.id).length > 0) {
                const sid = String(u.id);
                if (!map.has(sid)) {
                    map.set(sid, {
                        id: sid,
                        username: u.username || 'Участник',
                        email: u.email,
                    });
                }
            }
        }
        return Array.from(map.values()).sort((a, b) =>
            a.username.localeCompare(b.username, 'ru', { sensitivity: 'base' })
        );
    }, [members, files]);

    useEffect(() => {
        const fromGroup = group as { memberCount?: number; fileCount?: number } | undefined;
        setStats({
            memberCount: Math.max(members.length, fromGroup?.memberCount ?? 0),
            fileCount: Math.max(files.length, fromGroup?.fileCount ?? 0),
        });
    }, [members, files, group]);

    useEffect(() => {
        if (group) {
            setGroupName(group.name);
            setGroupDescription(group.description ?? '');
        }
    }, [group]);

    const handleFileUpload = async () => {
        if (!selectedFile) return;

        try {
            await uploadFileMutation.mutateAsync(selectedFile);
            setSelectedFile(null);

            // Обновляем данные после загрузки файла
            await Promise.all([
                refetchFiles(),
                refetchMembers(),
                refetchGroup(),
            ]);
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
        } catch (err: unknown) {
            console.error('Upload failed:', err);
            error(getApiErrorMessage(err, 'Не удалось загрузить файл'));
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
            success('Файл скачан');
        } catch (err: unknown) {
            console.error('Download failed:', err);
            error(getApiErrorMessage(err, 'Не удалось скачать файл'));
        }
    };

    const handleDeleteFile = async (file: FileMetadata) => {
        if (!window.confirm('Удалить этот файл?')) return;
        try {
            await deleteFileMutation.mutateAsync({
                fileId: file.id,
                expectedVersion: file.version,
            });
        } catch {
            /* Сообщение об ошибке: axios + useDeleteFile */
        }
    };

    const openRenameModal = (file: FileMetadata) => {
        setRenameTarget(file);
        setRenameValue(file.originalName);
    };

    const closeRenameModal = () => {
        setRenameTarget(null);
        setRenameValue('');
    };

    const handleRenameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renameTarget || !id) return;
        const name = renameValue.trim();
        if (!name) {
            error('Введите имя файла');
            return;
        }
        if (name === renameTarget.originalName) {
            closeRenameModal();
            return;
        }
        setRenaming(true);
        try {
            await fileApi.renameFile(renameTarget.id, name, renameTarget.version);
            await refetchFiles();
            await refetchGroup();
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            success('Файл переименован');
            closeRenameModal();
        } catch (err: unknown) {
            error(getApiErrorMessage(err, 'Не удалось переименовать файл'));
        } finally {
            setRenaming(false);
        }
    };

    const handleGenerateInviteLink = async () => {
        if (!id) return;

        try {
            const response = await groupApi.getInviteToken(id);
            const token = response.token;
            const link = `${window.location.origin}/join/${token}`;
            setInviteLink(link);
            success('Ссылка-приглашение создана');
        } catch (err: unknown) {
            console.error('Failed to generate invite token:', err);
            error(getApiErrorMessage(err, 'Не удалось создать ссылку'));
        }
    };

    const handleCopyInviteLink = () => {
        if (!inviteLink) return;

        navigator.clipboard.writeText(inviteLink)
            .then(() => success('Ссылка скопирована'))
            .catch(() => error('Не удалось скопировать'));
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
            success('Настройки группы сохранены');
        } catch (err: unknown) {
            console.error('Failed to update group:', err);
            error(getApiErrorMessage(err, 'Не удалось сохранить настройки'));
        }
    };

    const handleInviteMembers = () => {
        setShowInviteModal(true);
        setInviteQuery('');
        setInviteResults([]);
        handleGenerateInviteLink();
    };

    useEffect(() => {
        if (!showInviteModal || !id) return;
        const q = inviteQuery.trim();
        if (q.length < 2) {
            setInviteResults([]);
            return;
        }
        const t = setTimeout(async () => {
            setInviteSearchLoading(true);
            try {
                const found = await userApi.searchUsers(q, id);
                const mine = currentUser?.id;
                setInviteResults(
                    mine ? found.filter((u) => u.id !== mine) : found
                );
            } catch {
                setInviteResults([]);
            } finally {
                setInviteSearchLoading(false);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [inviteQuery, showInviteModal, id, currentUser?.id]);

    const handleAddMemberByUsername = useCallback(
        async (userId: string) => {
            if (!id) return;
            setAddingUserId(userId);
            try {
                await groupApi.addMember(id, userId);
                await refetchMembers();
                await refetchGroup();
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                success('Участник добавлен');
                setInviteQuery('');
                setInviteResults([]);
            } catch (err: unknown) {
                error(getApiErrorMessage(err, 'Не удалось добавить участника'));
            } finally {
                setAddingUserId(null);
            }
        },
        [id, refetchMembers, refetchGroup, success, error, queryClient]
    );

    // Показать загрузку (members грузим отдельно — не блокируем страницу)
    if (groupLoading || filesLoading) {
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">Группа не найдена</h2>
                <p className="text-gray-600 dark:text-slate-400 mb-4">Группа не существует или у вас нет доступа.</p>
                <Button variant="primary" onClick={() => navigate('/groups')}>
                    К списку групп
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-w-0">
            <PageHero
                badge="Группа"
                title={group.name}
                subtitle={group.description || 'Файлы, участники и общий чат'}
            >
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-end sm:w-auto sm:shrink-0">
                    <Button
                        variant="secondary"
                        className="w-full justify-center sm:w-auto flex items-center bg-white/95 text-indigo-900 border-white/50 dark:bg-slate-800/95 dark:text-slate-100 dark:border-slate-600 shadow-md"
                        onClick={() => setShowSettingsModal(true)}
                    >
                        <Settings className="mr-2 h-5 w-5 shrink-0" />
                        Настройки
                    </Button>
                    <Button variant="primary" className="w-full justify-center sm:w-auto flex items-center shadow-lg" onClick={handleOpenChat}>
                        <MessageSquare className="mr-2 h-5 w-5 shrink-0" />
                        Открыть чат
                    </Button>
                </div>
            </PageHero>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Левая колонка - Файлы */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-3">
                                {/* Одна строка: заголовок + счётчик слева, кнопки справа — без привязки к высоте текста ниже */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                                            Файлы ({stats.fileCount})
                                        </h3>
                                        {files.length > 0 &&
                                            (selectedCategories.size > 0 ||
                                                selectedUploaderIds.size > 0 ||
                                                fileSearchQuery.trim()) && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Показано: {filteredFiles.length} из {files.length}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex w-full min-w-0 shrink-0 sm:ml-auto sm:w-auto sm:justify-end">
                                        <div className="relative min-w-0 w-full sm:w-auto sm:shrink-0">
                                            <input
                                                type="file"
                                                id="file-upload"
                                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            />
                                            <label htmlFor="file-upload" className="block w-full sm:inline-block">
                                                <Button
                                                    variant="secondary"
                                                    className="flex w-full cursor-pointer items-center justify-center whitespace-nowrap sm:w-auto"
                                                >
                                                    <Upload className="mr-2 h-5 w-5 shrink-0" />
                                                    Выбрать файл
                                                </Button>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {selectedFile && (
                                    <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50/90 p-3.5 shadow-sm ring-1 ring-indigo-100/40 dark:border-indigo-900/45 dark:from-indigo-950/35 dark:via-slate-900/55 dark:to-slate-950/80 dark:ring-indigo-950/40 sm:p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300">
                                                    <FileText className="h-5 w-5" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                        Файл к загрузке
                                                    </p>
                                                    <p
                                                        className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100"
                                                        title={selectedFile.name}
                                                    >
                                                        {selectedFile.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {formatFileSize(selectedFile.size)}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedFile(null)}
                                                    className="mt-0.5 shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                                                    aria-label="Сбросить выбор файла"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <Button
                                                variant="primary"
                                                onClick={handleFileUpload}
                                                loading={uploadFileMutation.isPending}
                                                disabled={uploadFileMutation.isPending}
                                                className="w-full shrink-0 justify-center sm:w-auto sm:min-w-[11rem]"
                                            >
                                                <Upload className="mr-2 h-4 w-4 shrink-0" />
                                                Загрузить
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {storageSettings?.description && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 dark:border-slate-600/60 dark:bg-slate-800/40">
                                        {storageSettings.description}
                                    </p>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 space-y-4">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="search"
                                                value={fileSearchQuery}
                                                onChange={(e) => setFileSearchQuery(e.target.value)}
                                                placeholder="Поиск по имени файла или автору…"
                                                className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-900/5 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-500"
                                            />
                                        </div>

                                        <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/90 to-white dark:from-slate-900/60 dark:to-slate-900/40 dark:border-slate-600/80 p-4 shadow-sm space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300">
                                                        <Filter className="h-4 w-4" />
                                                    </span>
                                                    Фильтры
                                                </div>
                                                {(selectedCategories.size > 0 ||
                                                    selectedUploaderIds.size > 0 ||
                                                    fileSearchQuery.trim()) && (
                                                    <button
                                                        type="button"
                                                        onClick={clearFileFilters}
                                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        Сбросить всё
                                                    </button>
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                                                    Тип файла
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-500 mb-2.5">
                                                    Несколько галочек — показать файлы любого из выбранных типов. Без выбора — все типы.
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {CATEGORY_OPTIONS.map(({ id, label, icon: Icon }) => {
                                                        const checked = selectedCategories.has(id);
                                                        return (
                                                            <label
                                                                key={id}
                                                                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                                                                    checked
                                                                        ? 'border-indigo-400 bg-indigo-50/90 text-indigo-950 shadow-sm dark:border-indigo-500/60 dark:bg-indigo-950/35 dark:text-indigo-50'
                                                                        : 'border-slate-200/90 bg-white/80 text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-slate-500'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-500 dark:bg-slate-800"
                                                                    checked={checked}
                                                                    onChange={() => toggleCategory(id)}
                                                                />
                                                                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                                                                <span className="font-medium leading-tight">{label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                                                    Кто загрузил
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-500 mb-2.5">
                                                    {uploadFilterRows.length === 0
                                                        ? 'Пока нет ни участников группы, ни авторов в файлах — загрузите файл или дождитесь списка участников.'
                                                        : 'Можно выбрать несколько: покажутся файлы выбранных авторов. Без выбора — все.'}
                                                </p>
                                                {uploadFilterRows.length > 0 && (
                                                    <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200/80 bg-white/60 dark:border-slate-600 dark:bg-slate-900/30 divide-y divide-slate-100 dark:divide-slate-700/80">
                                                        {uploadFilterRows.map((row) => {
                                                            const checked = selectedUploaderIds.has(row.id);
                                                            return (
                                                                <label
                                                                    key={row.id}
                                                                    className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${
                                                                        checked
                                                                            ? 'bg-indigo-50/70 dark:bg-indigo-950/25'
                                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-500 dark:bg-slate-800"
                                                                        checked={checked}
                                                                        onChange={() => toggleUploader(row.id)}
                                                                    />
                                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                                                                        {(row.username || '?').slice(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                                                            {row.username}
                                                                        </p>
                                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                            {row.email || '—'}
                                                                        </p>
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-700/80">
                                                <span>
                                                    Показано{' '}
                                                    <strong className="text-slate-900 dark:text-slate-100">
                                                        {filteredFiles.length}
                                                    </strong>{' '}
                                                    из {files.length}
                                                </span>
                                                {filterSummaryParts.length > 0 && (
                                                    <span className="text-slate-500 dark:text-slate-500">
                                                        · {filterSummaryParts.join(' · ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                            {files.length === 0 ? (
                                <div className="text-center py-10">
                                    <FileText className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-slate-400">Файлов пока нет</p>
                                    <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">
                                        Загрузите первый файл — фильтры выше уже работают для типов и авторов.
                                    </p>
                                </div>
                            ) : filteredFiles.length === 0 ? (
                                        <div className="text-center py-10 rounded-xl border border-dashed border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30">
                                            <p className="text-slate-600 dark:text-slate-300 text-sm">Нет файлов по этим условиям</p>
                                            <button
                                                type="button"
                                                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                onClick={clearFileFilters}
                                            >
                                                Сбросить фильтр и поиск
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                    <div className="md:hidden space-y-3">
                                        {filteredFiles.map((file) => (
                                            <div
                                                key={`m-${file.id}`}
                                                className="rounded-xl border border-slate-200/90 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-900/45 p-4 shadow-sm"
                                            >
                                                <div className="flex gap-3 min-w-0">
                                                    <span className="text-2xl shrink-0 leading-none">{getFileIcon(file.fileType)}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 break-words flex flex-wrap items-center gap-x-2 gap-y-1">
                                                            {file.originalName}
                                                            {file.storageBackend === 'OBJECT_STORE' && (
                                                                <span className="inline-flex shrink-0 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                                                                    Облако
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                            {file.uploader?.username || 'неизвестно'}
                                                            {file.uploader?.firstName || file.uploader?.lastName
                                                                ? ` · ${[file.uploader?.firstName, file.uploader?.lastName].filter(Boolean).join(' ')}`
                                                                : ''}
                                                        </p>
                                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-gray-500 dark:text-slate-400">
                                                            <span>{formatFileSize(file.fileSize)}</span>
                                                            <span title={formatDate(file.uploadDate)}>{formatRelativeTime(file.uploadDate)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-600">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownload(file.id, file.originalName)}
                                                        className="flex-1 min-w-[5.5rem] justify-center sm:flex-initial"
                                                        title="Скачать"
                                                    >
                                                        <Download className="h-4 w-4 sm:mr-1" />
                                                        <span className="hidden sm:inline">Скачать</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openRenameModal(file)}
                                                        className="flex-1 min-w-[5.5rem] justify-center sm:flex-initial text-gray-700 dark:text-slate-300"
                                                        title="Переименовать"
                                                    >
                                                        <Pencil className="h-4 w-4 sm:mr-1" />
                                                        <span className="hidden sm:inline">Имя</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteFile(file)}
                                                        loading={deleteFileMutation.isPending}
                                                        disabled={deleteFileMutation.isPending}
                                                        className="flex-1 min-w-[5.5rem] justify-center sm:flex-initial text-red-600 hover:text-red-700"
                                                        title="Удалить"
                                                    >
                                                        <Trash2 className="h-4 w-4 sm:mr-1" />
                                                        <span className="hidden sm:inline">Удалить</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="hidden md:block overflow-x-auto -mx-1 px-1">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                            <thead>
                                            <tr>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                    Имя
                                                </th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                    Размер
                                                </th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                    Загружен
                                                </th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                    Действия
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                            {filteredFiles.map((file) => (
                                                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors">
                                                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span className="text-lg mr-3">{getFileIcon(file.fileType)}</span>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900 dark:text-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                    {file.originalName}
                                                                    {file.storageBackend === 'OBJECT_STORE' && (
                                                                        <span className="inline-flex shrink-0 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                                                                            Облако
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-gray-500 dark:text-slate-400">
                                                                    {file.uploader?.username || 'неизвестно'}
                                                                    {file.uploader?.firstName || file.uploader?.lastName
                                                                        ? ` · ${[file.uploader?.firstName, file.uploader?.lastName].filter(Boolean).join(' ')}`
                                                                        : ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                                        {formatFileSize(file.fileSize)}
                                                    </td>
                                                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                                        <span title={formatDate(file.uploadDate)}>{formatRelativeTime(file.uploadDate)}</span>
                                                    </td>
                                                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDownload(file.id, file.originalName)}
                                                                className="flex items-center"
                                                                title="Скачать"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openRenameModal(file)}
                                                                className="flex items-center text-gray-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-indigo-400"
                                                                title="Переименовать"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteFile(file)}
                                                                loading={deleteFileMutation.isPending}
                                                                disabled={deleteFileMutation.isPending}
                                                                className="flex items-center text-red-600 hover:text-red-700"
                                                                title="Удалить"
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
                                        </>
                                    )}
                        </CardContent>
                    </Card>
                </div>

                {/* Правая колонка - Участники и информация */}
                <div className="space-y-6">
                    {/* Участники группы */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Участники ({stats.memberCount})</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {members.length > 0 ? (
                                    members.map((member) => (
                                        <div key={member.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-slate-800/70 rounded-lg transition-colors">
                                            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-primary-600 dark:text-indigo-300" />
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{member.username}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">{member.email}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Участников нет</p>
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
                                Пригласить
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Информация о группе */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">О группе</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Создана</p>
                                    <p className="text-sm text-gray-900 dark:text-slate-100">{formatDate(group.creationDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Создатель</p>
                                    <p className="text-sm text-gray-900 dark:text-slate-100">{group.creatorUsername || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Всего файлов</p>
                                    <p className="text-sm text-gray-900 dark:text-slate-100">{stats.fileCount}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Всего участников</p>
                                    <p className="text-sm text-gray-900 dark:text-slate-100">{stats.memberCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Модальное окно приглашения участников */}
            {showInviteModal && (
                <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)}>
                    <div className="p-4 sm:p-6 max-w-md w-full mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Приглашение</h3>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-2">
                                    Добавить по имени пользователя
                                </p>
                                <Input
                                    placeholder="Минимум 2 символа…"
                                    value={inviteQuery}
                                    onChange={(e) => setInviteQuery(e.target.value)}
                                    className="mb-2"
                                />
                                {inviteSearchLoading && (
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Поиск…</p>
                                )}
                                {inviteResults.length > 0 && (
                                    <ul className="border border-gray-200 dark:border-slate-600 rounded-lg divide-y divide-gray-200 dark:divide-slate-700 max-h-40 overflow-y-auto mb-2 bg-slate-50/50 dark:bg-slate-800/40">
                                        {inviteResults.map((u) => (
                                            <li
                                                key={String(u.id)}
                                                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                            >
                                                <span className="text-gray-900 dark:text-slate-100">
                                                    {u.username ?? '—'}
                                                    <span className="text-gray-500 dark:text-slate-400 ml-2">
                                                        {formatUserListSubtitle(u)}
                                                    </span>
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    loading={addingUserId === u.id}
                                                    disabled={addingUserId !== null}
                                                    onClick={() => handleAddMemberByUsername(u.id)}
                                                >
                                                    Добавить
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                                    Или отправьте ссылку участникам:
                                </p>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        readOnly
                                        value={inviteLink || 'Генерация…'}
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
                                    Закрыть
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleGenerateInviteLink}
                                    className="flex items-center"
                                >
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Новая ссылка
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Модальное окно настроек группы */}
            {showSettingsModal && (
                <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)}>
                    <div className="p-4 sm:p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Настройки группы</h3>
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Название
                                </label>
                                <Input
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Название группы"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Описание
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                    value={groupDescription}
                                    onChange={(e) => setGroupDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Описание группы"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowSettingsModal(false)}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveSettings}
                                >
                                    Сохранить
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {renameTarget && (
                <Modal isOpen={!!renameTarget} onClose={closeRenameModal}>
                    <form
                        onSubmit={handleRenameSubmit}
                        className="p-4 sm:p-6 max-w-md w-full mx-auto"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Переименовать файл</h3>
                            <button
                                type="button"
                                onClick={closeRenameModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                            Новое отображаемое имя (расширение можно оставить или изменить).
                        </p>
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="Имя файла"
                            className="mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={closeRenameModal}>
                                Отмена
                            </Button>
                            <Button type="submit" variant="primary" loading={renaming} disabled={renaming}>
                                Сохранить
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default GroupDetail;