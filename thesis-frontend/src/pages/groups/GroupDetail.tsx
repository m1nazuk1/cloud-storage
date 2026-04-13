import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, FileText, MessageSquare, Settings, Plus, Copy, Share2, X, Search, Filter, Image as ImageIcon, Code2, Film, Archive, MoreHorizontal, GitCompare, } from 'lucide-react';
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
import { FileMetadata, User, FileNote, FileRevision } from '../../types';
import { userApi } from '../../api/user';
import { useAuth } from '../../contexts/AuthContext';
import { filterGroupFiles, type NonAllCategory, } from '../../utils/fileCategories';
import UserAvatar from '../../components/chat/UserAvatar';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useGroupPresence } from '../../hooks/useGroupPresence';
import GroupCoverThumb from '../../components/groups/GroupCoverThumb';
import GroupFileActionMenus from '../../components/groups/GroupFileActionMenus';
const GroupDetail: React.FC = () => {
    const { id } = useParams<{
        id: string;
    }>();
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
    const [coverBusy, setCoverBusy] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<Set<NonAllCategory>>(() => new Set());
    const [selectedUploaderIds, setSelectedUploaderIds] = useState<Set<string>>(() => new Set());
    const [fileSearchQuery, setFileSearchQuery] = useState('');
    const debouncedSearch = useDebouncedValue(fileSearchQuery, 400);
    const { t, i18n } = useTranslation();
    const CATEGORY_OPTIONS = useMemo(() => [
        { id: 'images' as NonAllCategory, label: t('group.cat.images'), icon: ImageIcon },
        { id: 'documents' as NonAllCategory, label: t('group.cat.documents'), icon: FileText },
        { id: 'code' as NonAllCategory, label: t('group.cat.code'), icon: Code2 },
        { id: 'media' as NonAllCategory, label: t('group.cat.media'), icon: Film },
        { id: 'archives' as NonAllCategory, label: t('group.cat.archives'), icon: Archive },
        { id: 'other' as NonAllCategory, label: t('group.cat.other'), icon: MoreHorizontal },
    ], [t]);
    const onlineIds = useGroupPresence(id);
    const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewText, setPreviewText] = useState<string | null>(null);
    const [notesFileId, setNotesFileId] = useState<string | null>(null);
    const [noteDraft, setNoteDraft] = useState('');
    const [revisionsFileId, setRevisionsFileId] = useState<string | null>(null);
    const [diffLeft, setDiffLeft] = useState('');
    const [diffRight, setDiffRight] = useState('');
    const [diffText, setDiffText] = useState<string | null>(null);
    const previewBlobUrlRef = useRef<string | null>(null);
    const replaceFileInputRef = useRef<HTMLInputElement>(null);
    const pendingReplaceFileRef = useRef<FileMetadata | null>(null);
    const [replacingFileId, setReplacingFileId] = useState<string | null>(null);
    const toggleCategory = useCallback((id: NonAllCategory) => {
        setSelectedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    }, []);
    const toggleUploader = useCallback((userId: string) => {
        setSelectedUploaderIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId))
                next.delete(userId);
            else
                next.add(userId);
            return next;
        });
    }, []);
    const clearFileFilters = useCallback(() => {
        setSelectedCategories(new Set());
        setSelectedUploaderIds(new Set());
        setFileSearchQuery('');
    }, []);
    const { data: group, isLoading: groupLoading, error: groupError, refetch: refetchGroup } = useQuery({
        queryKey: ['group', id],
        queryFn: () => groupApi.getGroup(id!),
        enabled: !!id,
    });
    const { data: groupStats } = useQuery({
        queryKey: ['group', id, 'stats'],
        queryFn: () => groupApi.getGroupStats(id!),
        enabled: !!id,
    });
    const isCreator = !!groupStats?.isCreator;
    const { data: membersData = [], refetch: refetchMembers } = useQuery({
        queryKey: ['group', id, 'members'],
        queryFn: () => groupApi.getGroupMembers(id!),
        enabled: !!id,
    });
    const { data: filesData, isLoading: filesLoading, refetch: refetchFiles } = useQuery({
        queryKey: ['files', id],
        queryFn: (): Promise<FileMetadata[]> => fileApi.getGroupFiles(id!),
        enabled: !!id,
    });
    const { data: searchHitFiles } = useQuery({
        queryKey: ['files-search', id, debouncedSearch],
        queryFn: () => fileApi.searchFiles(id!, debouncedSearch),
        enabled: !!id && debouncedSearch.trim().length >= 2,
    });
    const { data: fileNotes = [], refetch: refetchNotes } = useQuery<FileNote[]>({
        queryKey: ['file-notes', notesFileId],
        queryFn: () => fileApi.listNotes(notesFileId!),
        enabled: !!notesFileId,
    });
    const { data: revisions = [] } = useQuery<FileRevision[]>({
        queryKey: ['file-revisions', revisionsFileId],
        queryFn: () => fileApi.listRevisions(revisionsFileId!),
        enabled: !!revisionsFileId,
    });
    const uploadFileMutation = useUploadFile(id!);
    const deleteFileMutation = useDeleteFile();
    const files = Array.isArray(filesData) ? filesData : [];
    const members = Array.isArray(membersData) ? membersData : [];
    const filesForFilter = useMemo(() => {
        if (debouncedSearch.trim().length >= 2) {
            return Array.isArray(searchHitFiles) ? searchHitFiles : [];
        }
        return files;
    }, [files, searchHitFiles, debouncedSearch]);
    const searchForLocalFilter = debouncedSearch.trim().length >= 2 ? '' : fileSearchQuery;
    const filteredFiles = useMemo(() => filterGroupFiles(filesForFilter, selectedCategories, selectedUploaderIds, searchForLocalFilter), [filesForFilter, selectedCategories, selectedUploaderIds, searchForLocalFilter]);
    const listTotal = debouncedSearch.trim().length >= 2 ? filesForFilter.length : files.length;
    const filterSummaryParts = useMemo(() => {
        const parts: string[] = [];
        if (selectedCategories.size > 0) {
            const labels = CATEGORY_OPTIONS.filter((o) => selectedCategories.has(o.id)).map((o) => o.label);
            if (labels.length)
                parts.push(labels.join(', '));
        }
        if (selectedUploaderIds.size > 0) {
            parts.push(t('group.participantsCount', { count: selectedUploaderIds.size }));
        }
        return parts;
    }, [selectedCategories, selectedUploaderIds, t, CATEGORY_OPTIONS]);
    const uploadFilterRows = useMemo(() => {
        type Row = {
            id: string;
            username: string;
            email?: string;
        };
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
                        username: u.username || t('group.memberFallback'),
                        email: u.email,
                    });
                }
            }
        }
        return Array.from(map.values()).sort((a, b) => a.username.localeCompare(b.username, (i18n.language || 'en').replace('_', '-'), { sensitivity: 'base' }));
    }, [members, files, t, i18n.language]);
    useEffect(() => {
        const fromGroup = group as {
            memberCount?: number;
            fileCount?: number;
        } | undefined;
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
        if (!selectedFile)
            return;
        try {
            await uploadFileMutation.mutateAsync(selectedFile);
            setSelectedFile(null);
            await Promise.all([
                refetchFiles(),
                refetchMembers(),
                refetchGroup(),
            ]);
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
        }
        catch (err: unknown) {
            console.error('Upload failed:', err);
            error(getApiErrorMessage(err, t('group.err.upload')));
        }
    };
    const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f || !id)
            return;
        if (!f.type.startsWith('image/')) {
            error(t('group.err.imageOnly'));
            return;
        }
        setCoverBusy(true);
        try {
            const meta = await fileApi.uploadFile(id, f);
            await groupApi.setGroupCover(id, meta.id);
            success(t('group.coverUpdated'));
            await refetchGroup();
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        }
        catch (err: unknown) {
            error(getApiErrorMessage(err, t('group.err.coverSet')));
        }
        finally {
            setCoverBusy(false);
        }
    };
    const handleClearCover = async () => {
        if (!id)
            return;
        setCoverBusy(true);
        try {
            await groupApi.clearGroupCover(id);
            success(t('group.coverRemoved'));
            await refetchGroup();
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        }
        catch (err: unknown) {
            error(getApiErrorMessage(err, t('group.err.coverRemove')));
        }
        finally {
            setCoverBusy(false);
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
            success(t('group.downloaded'));
        }
        catch (err: unknown) {
            console.error('Download failed:', err);
            error(getApiErrorMessage(err, t('group.err.download')));
        }
    };
    useEffect(() => {
        if (previewBlobUrlRef.current) {
            URL.revokeObjectURL(previewBlobUrlRef.current);
            previewBlobUrlRef.current = null;
        }
        setPreviewUrl(null);
        setPreviewText(null);
        if (!previewFile) {
            return;
        }
        let cancelled = false;
        void (async () => {
            try {
                const blob = await fileApi.previewFile(previewFile.id);
                const mime = previewFile.mimeType || '';
                const ext = (previewFile.fileType || '').toLowerCase();
                if (mime.startsWith('text/') || ['txt', 'md', 'csv', 'json', 'log'].includes(ext)) {
                    const text = await blob.text();
                    if (!cancelled) {
                        setPreviewText(text);
                    }
                    return;
                }
                const url = URL.createObjectURL(blob);
                previewBlobUrlRef.current = url;
                if (!cancelled) {
                    setPreviewUrl(url);
                }
            }
            catch {
                if (!cancelled) {
                    setPreviewUrl(null);
                    setPreviewText(null);
                }
            }
        })();
        return () => {
            cancelled = true;
            if (previewBlobUrlRef.current) {
                URL.revokeObjectURL(previewBlobUrlRef.current);
                previewBlobUrlRef.current = null;
            }
        };
    }, [previewFile]);
    const handleAddNote = async () => {
        if (!notesFileId || !noteDraft.trim()) {
            return;
        }
        try {
            await fileApi.addNote(notesFileId, noteDraft.trim());
            setNoteDraft('');
            await refetchNotes();
            queryClient.invalidateQueries({ queryKey: ['file-notes', notesFileId] });
            success(t('group.noteAdded'));
        }
        catch (err: unknown) {
            error(getApiErrorMessage(err, t('group.err.noteSave')));
        }
    };
    const handleDeleteNote = async (noteId: string) => {
        if (!notesFileId) {
            return;
        }
        try {
            await fileApi.deleteNote(notesFileId, noteId);
            await refetchNotes();
        }
        catch (err: unknown) {
            error(getApiErrorMessage(err, t('group.err.noteDelete')));
        }
    };
    const handleRunDiff = async () => {
        if (!revisionsFileId || !diffLeft || !diffRight) {
            error(t('group.selectTwo'));
            return;
        }
        if (diffLeft === diffRight) {
            error(t('group.selectTwo'));
            return;
        }
        try {
            const d = await fileApi.diffRevisions(revisionsFileId, diffLeft, diffRight);
            setDiffText(d);
        }
        catch (err: unknown) {
            error(getApiErrorMessage(err, t('group.err.diff')));
        }
    };
    const handleDeleteFile = async (file: FileMetadata) => {
        if (!window.confirm(t('group.confirmDeleteFile')))
            return;
        try {
            await deleteFileMutation.mutateAsync({
                fileId: file.id,
                expectedVersion: file.version,
            });
        }
        catch {
            void 0;
        }
    };
    const startReplaceFile = (file: FileMetadata) => {
        pendingReplaceFileRef.current = file;
        requestAnimationFrame(() => replaceFileInputRef.current?.click());
    };
    const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        e.target.value = '';
        const meta = pendingReplaceFileRef.current;
        pendingReplaceFileRef.current = null;
        if (!picked || !meta)
            return;
        setReplacingFileId(meta.id);
        try {
            await fileApi.updateFileContent(meta.id, picked, meta.version);
            await refetchFiles();
            await refetchGroup();
            queryClient.invalidateQueries({ queryKey: ['file-revisions', meta.id] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            success(t('group.replaceOk'));
        }
        catch (err: unknown) {
            error(getApiErrorMessage(err, t('group.err.replace')));
        }
        finally {
            setReplacingFileId(null);
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
        if (!renameTarget || !id)
            return;
        const name = renameValue.trim();
        if (!name) {
            error(t('group.err.renameEmpty'));
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
            success(t('group.renamed'));
            closeRenameModal();
        }
        catch (err: unknown) {
            error(getApiErrorMessage(err, t('group.err.rename')));
        }
        finally {
            setRenaming(false);
        }
    };
    const handleGenerateInviteLink = async () => {
        if (!id)
            return;
        try {
            const response = await groupApi.getInviteToken(id);
            const token = response.token;
            const link = `${window.location.origin}/join/${token}`;
            setInviteLink(link);
            success(t('group.inviteCreated'));
        }
        catch (err: unknown) {
            console.error('Failed to generate invite token:', err);
            error(getApiErrorMessage(err, t('group.err.invite')));
        }
    };
    const handleCopyInviteLink = () => {
        if (!inviteLink)
            return;
        navigator.clipboard.writeText(inviteLink)
            .then(() => success(t('group.linkCopied')))
            .catch(() => error(t('group.err.copy')));
    };
    const handleOpenChat = () => {
        if (!id)
            return;
        navigate(`/chat/${id}`);
    };
    const handleSaveSettings = async () => {
        if (!id)
            return;
        try {
            await groupApi.updateGroup(id, {
                name: groupName,
                description: groupDescription,
                regenerateToken: false
            });
            await refetchGroup();
            setShowSettingsModal(false);
            success(t('group.settingsSaved'));
        }
        catch (err: unknown) {
            console.error('Failed to update group:', err);
            error(getApiErrorMessage(err, t('group.err.settings')));
        }
    };
    const handleInviteMembers = () => {
        setShowInviteModal(true);
        setInviteQuery('');
        setInviteResults([]);
        handleGenerateInviteLink();
    };
    useEffect(() => {
        if (!showInviteModal || !id)
            return;
        const q = inviteQuery.trim();
        if (q.length < 2) {
            setInviteResults([]);
            return;
        }
        const debounceTimer = setTimeout(async () => {
            setInviteSearchLoading(true);
            try {
                const found = await userApi.searchUsers(q, id);
                const mine = currentUser?.id;
                setInviteResults(mine ? found.filter((u) => u.id !== mine) : found);
            }
            catch {
                setInviteResults([]);
            }
            finally {
                setInviteSearchLoading(false);
            }
        }, 350);
        return () => clearTimeout(debounceTimer);
    }, [inviteQuery, showInviteModal, id, currentUser?.id]);
    const handleAddMemberByUsername = useCallback(async (userId: string) => {
        if (!id)
            return;
        setAddingUserId(userId);
        try {
            await groupApi.addMember(id, userId);
            await refetchMembers();
            await refetchGroup();
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            success(t('group.memberAdded'));
            setInviteQuery('');
            setInviteResults([]);
        }
        catch (err: unknown) {
            error(getApiErrorMessage(err, t('group.err.addMember')));
        }
        finally {
            setAddingUserId(null);
        }
    }, [id, refetchMembers, refetchGroup, success, error, queryClient]);
    if (groupLoading || filesLoading) {
        return (<div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>);
    }
    if (groupError || !group) {
        return (<div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">{t('group.notFound')}</h2>
                <p className="text-gray-600 dark:text-slate-400 mb-4">{t('group.notFoundHint')}</p>
                <Button variant="primary" onClick={() => navigate('/groups')}>
                    {t('group.backToList')}
                </Button>
            </div>);
    }
    return (<div className="space-y-6 min-w-0">
            <PageHero badge={t('group.badge')} title={group.name} subtitle={group.description || t('group.subtitleDefault')}>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-end sm:w-auto sm:shrink-0">
                    <Button variant="secondary" className="w-full justify-center sm:w-auto flex items-center bg-white/95 text-indigo-900 border-white/50 dark:bg-slate-800/95 dark:text-slate-100 dark:border-slate-600 shadow-md" onClick={() => setShowSettingsModal(true)}>
                        <Settings className="mr-2 h-5 w-5 shrink-0"/>
                        {t('group.settings')}
                    </Button>
                    <Button variant="primary" className="w-full justify-center sm:w-auto flex items-center shadow-lg" onClick={handleOpenChat}>
                        <MessageSquare className="mr-2 h-5 w-5 shrink-0"/>
                        {t('group.openChat')}
                    </Button>
                </div>
            </PageHero>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-3">
                                
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                                            {t('group.files')} ({stats.fileCount})
                                        </h3>
                                        {listTotal > 0 &&
            (selectedCategories.size > 0 ||
                selectedUploaderIds.size > 0 ||
                fileSearchQuery.trim()) && (<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {t('group.shownFiles', { filtered: filteredFiles.length, total: listTotal })}
                                            </p>)}
                                    </div>
                                    <div className="flex w-full min-w-0 shrink-0 sm:ml-auto sm:w-auto sm:justify-end">
                                        <div className="relative min-w-0 w-full sm:w-auto sm:shrink-0">
                                            <input type="file" id="file-upload" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}/>
                                            <label htmlFor="file-upload" className="block w-full sm:inline-block">
                                                <Button variant="secondary" className="flex w-full cursor-pointer items-center justify-center whitespace-nowrap sm:w-auto">
                                                    <Upload className="mr-2 h-5 w-5 shrink-0"/>
                                                    {t('group.chooseFile')}
                                                </Button>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {selectedFile && (<div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50/90 p-3.5 shadow-sm ring-1 ring-indigo-100/40 dark:border-indigo-900/45 dark:from-indigo-950/35 dark:via-slate-900/55 dark:to-slate-950/80 dark:ring-indigo-950/40 sm:p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300">
                                                    <FileText className="h-5 w-5"/>
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                        {t('group.fileToUpload')}
                                                    </p>
                                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={selectedFile.name}>
                                                        {selectedFile.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {formatFileSize(selectedFile.size)}
                                                    </p>
                                                </div>
                                                <button type="button" onClick={() => setSelectedFile(null)} className="mt-0.5 shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-100" aria-label={t('group.clearFile')}>
                                                    <X className="h-4 w-4"/>
                                                </button>
                                            </div>
                                            <Button variant="primary" onClick={handleFileUpload} loading={uploadFileMutation.isPending} disabled={uploadFileMutation.isPending} className="w-full shrink-0 justify-center sm:w-auto sm:min-w-[11rem]">
                                                <Upload className="mr-2 h-4 w-4 shrink-0"/>
                                                {t('group.upload')}
                                            </Button>
                                        </div>
                                    </div>)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <input ref={replaceFileInputRef} type="file" className="hidden" aria-hidden tabIndex={-1} onChange={handleReplaceFileChange}/>
                            <div className="mb-4 space-y-4">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                                            <input type="search" value={fileSearchQuery} onChange={(e) => setFileSearchQuery(e.target.value)} placeholder={t('group.searchFiles')} className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-900/5 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-500"/>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/90 to-white dark:from-slate-900/60 dark:to-slate-900/40 dark:border-slate-600/80 p-4 shadow-sm space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300">
                                                        <Filter className="h-4 w-4"/>
                                                    </span>
                                                    {t('group.filters')}
                                                </div>
                                                {(selectedCategories.size > 0 ||
            selectedUploaderIds.size > 0 ||
            fileSearchQuery.trim()) && (<button type="button" onClick={clearFileFilters} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                        {t('group.resetFilters')}
                                                    </button>)}
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                                                    {t('group.fileType')}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-500 mb-2.5">
                                                    {t('group.fileTypeHint')}
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {CATEGORY_OPTIONS.map(({ id, label, icon: Icon }) => {
            const checked = selectedCategories.has(id);
            return (<label key={id} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors ${checked
                    ? 'border-indigo-400 bg-indigo-50/90 text-indigo-950 shadow-sm dark:border-indigo-500/60 dark:bg-indigo-950/35 dark:text-indigo-50'
                    : 'border-slate-200/90 bg-white/80 text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-slate-500'}`}>
                                                                <input type="checkbox" className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-500 dark:bg-slate-800" checked={checked} onChange={() => toggleCategory(id)}/>
                                                                <Icon className="h-4 w-4 shrink-0 opacity-80"/>
                                                                <span className="font-medium leading-tight">{label}</span>
                                                            </label>);
        })}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                                                    {t('group.uploadedBy')}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-500 mb-2.5">
                                                    {uploadFilterRows.length === 0
            ? t('group.uploadFilterEmpty')
            : t('group.uploadFilterHint')}
                                                </p>
                                                {uploadFilterRows.length > 0 && (<div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200/80 bg-white/60 dark:border-slate-600 dark:bg-slate-900/30 divide-y divide-slate-100 dark:divide-slate-700/80">
                                                        {uploadFilterRows.map((row) => {
                const checked = selectedUploaderIds.has(row.id);
                return (<label key={row.id} className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${checked
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/25'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                                    <input type="checkbox" className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-500 dark:bg-slate-800" checked={checked} onChange={() => toggleUploader(row.id)}/>
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
                                                                </label>);
            })}
                                                    </div>)}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-700/80">
                                                <span>
                                                    {t('group.shownFiles', { filtered: filteredFiles.length, total: listTotal })}
                                                </span>
                                                {filterSummaryParts.length > 0 && (<span className="text-slate-500 dark:text-slate-500">
                                                        · {filterSummaryParts.join(' · ')}
                                                    </span>)}
                                            </div>
                                        </div>
                                    </div>
                            {listTotal === 0 ? (<div className="text-center py-10">
                                    <FileText className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4"/>
                                    <p className="text-gray-500 dark:text-slate-400">{t('group.noFiles')}</p>
                                    <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">
                                        {t('group.noFilesHint')}
                                    </p>
                                </div>) : filteredFiles.length === 0 ? (<div className="text-center py-10 rounded-xl border border-dashed border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30">
                                            <p className="text-slate-600 dark:text-slate-300 text-sm">{t('group.noMatch')}</p>
                                            <button type="button" className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300" onClick={clearFileFilters}>
                                                {t('group.resetFiltersSearch')}
                                            </button>
                                        </div>) : (<>
                                    <div className="md:hidden space-y-3">
                                        {filteredFiles.map((file) => (<div key={`m-${file.id}`} className="rounded-xl border border-slate-200/90 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-900/45 p-4 shadow-sm">
                                                <div className="flex gap-3 min-w-0">
                                                    <span className="text-2xl shrink-0 leading-none">{getFileIcon(file.fileType)}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 break-words flex flex-wrap items-center gap-x-2 gap-y-1">
                                                            {file.originalName}
                                                            {file.storageBackend === 'OBJECT_STORE' && (<span className="inline-flex shrink-0 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                                                                    {t('common.cloud')}
                                                                </span>)}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                            {file.uploader?.username || t('common.unknown')}
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
                                                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-600">
                                                    <GroupFileActionMenus variant="card" onPreview={() => setPreviewFile(file)} onDownload={() => void handleDownload(file.id, file.originalName)} onNotes={() => {
                setNotesFileId(file.id);
                setNoteDraft('');
            }} onVersions={() => {
                setRevisionsFileId(file.id);
                setDiffLeft('');
                setDiffRight('');
                setDiffText(null);
            }} onReplace={() => startReplaceFile(file)} onRename={() => openRenameModal(file)} onDelete={() => void handleDeleteFile(file)} deletePending={deleteFileMutation.isPending} replacePending={replacingFileId === file.id}/>
                                                </div>
                                            </div>))}
                                    </div>
                                    <div className="hidden md:block overflow-x-auto -mx-1 px-1">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                            <thead>
                                            <tr>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                    {t('group.table.name')}
                                                </th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                    {t('group.table.size')}
                                                </th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                    {t('group.table.uploaded')}
                                                </th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                                    {t('group.table.actions')}
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                            {filteredFiles.map((file) => (<tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors">
                                                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span className="text-lg mr-3">{getFileIcon(file.fileType)}</span>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900 dark:text-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                    {file.originalName}
                                                                    {file.storageBackend === 'OBJECT_STORE' && (<span className="inline-flex shrink-0 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                                                                            {t('common.cloud')}
                                                                        </span>)}
                                                                </div>
                                                                <div className="text-sm text-gray-500 dark:text-slate-400">
                                                                    {file.uploader?.username || t('common.unknown')}
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
                                                        <div className="flex items-center justify-end">
                                                            <GroupFileActionMenus variant="table" onPreview={() => setPreviewFile(file)} onDownload={() => void handleDownload(file.id, file.originalName)} onNotes={() => {
                setNotesFileId(file.id);
                setNoteDraft('');
            }} onVersions={() => {
                setRevisionsFileId(file.id);
                setDiffLeft('');
                setDiffRight('');
                setDiffText(null);
            }} onReplace={() => startReplaceFile(file)} onRename={() => openRenameModal(file)} onDelete={() => void handleDeleteFile(file)} deletePending={deleteFileMutation.isPending} replacePending={replacingFileId === file.id}/>
                                                        </div>
                                                    </td>
                                                </tr>))}
                                            </tbody>
                                        </table>
                                    </div>
                                        </>)}
                        </CardContent>
                    </Card>
                </div>

                
                <div className="space-y-6">
                    
                    <Card>
                        <CardHeader>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('group.members')} ({stats.memberCount})</h3>
                                {onlineIds.length > 0 && (<p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                        {t('group.onlineNow')}: {onlineIds.length}
                                    </p>)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {members.length > 0 ? (members.map((member) => (<div key={member.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-slate-800/70 rounded-lg transition-colors">
                                            <div className="relative shrink-0">
                                                <UserAvatar user={member} className="h-8 w-8" label={member.username}/>
                                                {onlineIds.includes(String(member.id)) && (<span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="online"/>)}
                                            </div>
                                            <div className="ml-3 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{member.username}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">{member.email}</p>
                                            </div>
                                        </div>))) : (<div className="text-center py-4">
                                        <p className="text-sm text-gray-500 dark:text-slate-400">{t('group.noMembers')}</p>
                                    </div>)}
                            </div>
                            <Button variant="ghost" fullWidth className="mt-4" onClick={handleInviteMembers}>
                                <Plus className="mr-2 h-5 w-5"/>
                                {t('group.invite')}
                            </Button>
                        </CardContent>
                    </Card>

                    
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('group.about')}</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {group.coverFileId ? (<div className="rounded-xl overflow-hidden ring-1 ring-slate-200/70 dark:ring-slate-600/50 max-w-xs">
                                        <GroupCoverThumb fileId={group.coverFileId} className="h-28 w-full max-h-28" rounded="lg"/>
                                    </div>) : null}
                                {isCreator ? (<div className="flex flex-wrap items-center gap-2">
                                        <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80">
                                            <ImageIcon className="h-4 w-4 shrink-0 opacity-80"/>
                                            <span>{t('group.coverPhoto')}</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleCoverFile} disabled={coverBusy}/>
                                        </label>
                                        {group.coverFileId ? (<Button type="button" variant="ghost" size="sm" onClick={handleClearCover} disabled={coverBusy}>
                                                {t('group.removeCover')}
                                            </Button>) : null}
                                    </div>) : null}
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{t('group.created')}</p>
                                    <p className="text-sm text-gray-900 dark:text-slate-100">{formatDate(group.creationDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{t('group.creator')}</p>
                                    <p className="text-sm text-gray-900 dark:text-slate-100">{group.creatorUsername || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{t('group.totalFiles')}</p>
                                    <p className="text-sm text-gray-900 dark:text-slate-100">{stats.fileCount}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{t('group.totalMembers')}</p>
                                    <p className="text-sm text-gray-900 dark:text-slate-100">{stats.memberCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            
            {showInviteModal && (<Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)}>
                    <div className="p-4 sm:p-6 max-w-md w-full mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('group.inviteTitle')}</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <X className="h-5 w-5"/>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-2">
                                    {t('group.addByUsername')}
                                </p>
                                <Input placeholder={t('group.inviteSearchPh')} value={inviteQuery} onChange={(e) => setInviteQuery(e.target.value)} className="mb-2"/>
                                {inviteSearchLoading && (<p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{t('group.searching')}</p>)}
                                {inviteResults.length > 0 && (<ul className="border border-gray-200 dark:border-slate-600 rounded-lg divide-y divide-gray-200 dark:divide-slate-700 max-h-40 overflow-y-auto mb-2 bg-slate-50/50 dark:bg-slate-800/40">
                                        {inviteResults.map((u) => (<li key={String(u.id)} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                                                <span className="text-gray-900 dark:text-slate-100">
                                                    {u.username ?? '—'}
                                                    <span className="text-gray-500 dark:text-slate-400 ml-2">
                                                        {formatUserListSubtitle(u)}
                                                    </span>
                                                </span>
                                                <Button size="sm" variant="primary" loading={addingUserId === u.id} disabled={addingUserId !== null} onClick={() => handleAddMemberByUsername(u.id)}>
                                                    {t('group.add')}
                                                </Button>
                                            </li>))}
                                    </ul>)}
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                                    {t('group.orSendLink')}
                                </p>
                                <div className="flex items-center space-x-2">
                                    <Input readOnly value={inviteLink || t('group.generating')} className="flex-1 font-mono text-sm"/>
                                    <Button variant="secondary" onClick={handleCopyInviteLink} disabled={!inviteLink} className="flex items-center">
                                        <Copy className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
                                    {t('group.closeModal')}
                                </Button>
                                <Button variant="primary" onClick={handleGenerateInviteLink} className="flex items-center">
                                    <Share2 className="mr-2 h-4 w-4"/>
                                    {t('group.newLink')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>)}

            
            {showSettingsModal && (<Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)}>
                    <div className="p-4 sm:p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('group.settingsTitle')}</h3>
                            <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <X className="h-5 w-5"/>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('group.name')}
                                </label>
                                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder={t('group.namePh')}/>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('group.description')}
                                </label>
                                <textarea className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-slate-500" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} rows={3} placeholder={t('group.descPh')}/>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button variant="primary" onClick={handleSaveSettings}>
                                    {t('common.save')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>)}

            {previewFile && (<Modal isOpen={!!previewFile} onClose={() => setPreviewFile(null)}>
                    <div className="p-4 sm:p-6 max-w-4xl w-full mx-auto">
                        <div className="flex justify-between items-start gap-2 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 truncate min-w-0" title={previewFile.originalName}>
                                {previewFile.originalName}
                            </h3>
                            <button type="button" onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg p-1 shrink-0">
                                <X className="h-5 w-5"/>
                            </button>
                        </div>
                        <div className="max-h-[75vh] overflow-auto rounded-xl border border-slate-200/90 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-900/50">
                            {previewText != null ? (<pre className="p-3 text-xs whitespace-pre-wrap break-words text-slate-800 dark:text-slate-100 font-mono">
                                    {previewText}
                                </pre>) : previewUrl && (previewFile.mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes((previewFile.fileType || '').toLowerCase())) ? (<img src={previewUrl} alt="" className="max-w-full max-h-[70vh] w-auto mx-auto block"/>) : previewUrl && (previewFile.mimeType?.includes('pdf') || (previewFile.fileType || '').toLowerCase() === 'pdf') ? (<iframe title="pdf" src={previewUrl} className="w-full min-h-[70vh] rounded-b-xl bg-white"/>) : previewUrl && previewFile.mimeType?.startsWith('video/') ? (<video src={previewUrl} controls className="w-full max-h-[70vh] rounded-b-xl"/>) : previewUrl && previewFile.mimeType?.startsWith('audio/') ? (<audio src={previewUrl} controls className="w-full p-4"/>) : (<p className="p-6 text-sm text-slate-600 dark:text-slate-300">
                                    {t('group.noPreview')}
                                </p>)}
                        </div>
                    </div>
                </Modal>)}

            {notesFileId && (<Modal isOpen={!!notesFileId} onClose={() => setNotesFileId(null)}>
                    <div className="p-4 sm:p-6 max-w-lg w-full mx-auto">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('group.notes')}</h3>
                            <button type="button" onClick={() => setNotesFileId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg p-1">
                                <X className="h-5 w-5"/>
                            </button>
                        </div>
                        <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={3} placeholder={t('group.notePlaceholder')} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"/>
                        <Button type="button" variant="primary" className="mt-2" onClick={() => void handleAddNote()}>
                            {t('group.addNote')}
                        </Button>
                        <ul className="mt-4 space-y-2 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                            {fileNotes.map((n) => (<li key={n.id} className="pt-2 first:pt-0 text-sm">
                                    <div className="flex justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {n.authorUsername} · {formatRelativeTime(n.createdAt)}
                                            </p>
                                            <p className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">{n.body}</p>
                                        </div>
                                        {(String(currentUser?.id) === String(n.authorId) || isCreator) && (<button type="button" onClick={() => void handleDeleteNote(n.id)} className="shrink-0 text-xs text-red-600 hover:underline">
                                                {t('group.delete')}
                                            </button>)}
                                    </div>
                                </li>))}
                        </ul>
                    </div>
                </Modal>)}

            {revisionsFileId && (<Modal isOpen={!!revisionsFileId} onClose={() => setRevisionsFileId(null)}>
                    <div className="p-4 sm:p-6 max-w-3xl w-full mx-auto max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('group.revisionsTitle')}</h3>
                            <button type="button" onClick={() => setRevisionsFileId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg p-1">
                                <X className="h-5 w-5"/>
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                            {t('group.revisionsExplainer')}
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600 text-sm">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-800/80">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">v</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">{t('group.revisions.size')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">{t('group.revisions.when')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500"/>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {revisions.map((r) => (<tr key={r.id}>
                                            <td className="px-3 py-2 whitespace-nowrap">{r.fileVersionSnapshot}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{formatFileSize(r.sizeBytes)}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500">{formatRelativeTime(r.createdAt)}</td>
                                            <td className="px-3 py-2">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => void (async () => {
                    try {
                        const blob = await fileApi.downloadRevision(revisionsFileId, r.id);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = r.originalNameSnapshot || 'file';
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                    catch (err: unknown) {
                        error(getApiErrorMessage(err, t('group.err.versionDownload')));
                    }
                })()}>
                                                    <Download className="h-4 w-4"/>
                                                </Button>
                                            </td>
                                        </tr>))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <select value={diffLeft} onChange={(e) => setDiffLeft(e.target.value)} className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm py-1.5 px-2 max-w-[11rem]">
                                <option value="">—</option>
                                {revisions.map((r) => (<option key={`L-${r.id}`} value={r.id} disabled={!r.hasTextSnapshot}>
                                        v{r.fileVersionSnapshot}{r.hasTextSnapshot ? '' : ` ${t('group.versionNoText')}`}
                                    </option>))}
                            </select>
                            <select value={diffRight} onChange={(e) => setDiffRight(e.target.value)} className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm py-1.5 px-2 max-w-[11rem]">
                                <option value="">—</option>
                                {revisions.map((r) => (<option key={`R-${r.id}`} value={r.id} disabled={!r.hasTextSnapshot}>
                                        v{r.fileVersionSnapshot}{r.hasTextSnapshot ? '' : ` ${t('group.versionNoText')}`}
                                    </option>))}
                            </select>
                            <Button type="button" variant="secondary" size="sm" onClick={() => void handleRunDiff()} className="inline-flex items-center gap-1">
                                <GitCompare className="h-4 w-4"/>
                                {t('group.diff')}
                            </Button>
                        </div>
                        {diffText != null && diffText.length > 0 && (<div className="mt-4">
                                <p className="text-xs font-semibold text-slate-500 mb-1">{t('group.diffResult')}</p>
                                <pre className="text-xs overflow-auto max-h-56 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-lg whitespace-pre-wrap break-words border border-slate-200 dark:border-slate-600">
                                    {diffText}
                                </pre>
                            </div>)}
                    </div>
                </Modal>)}

            {renameTarget && (<Modal isOpen={!!renameTarget} onClose={closeRenameModal}>
                    <form onSubmit={handleRenameSubmit} className="p-4 sm:p-6 max-w-md w-full mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('group.renameFileTitle')}</h3>
                            <button type="button" onClick={closeRenameModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <X className="h-5 w-5"/>
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                            {t('group.renameFileHint')}
                        </p>
                        <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder={t('group.renamePh')} className="mb-4" autoFocus/>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={closeRenameModal}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" variant="primary" loading={renaming} disabled={renaming}>
                                {t('common.save')}
                            </Button>
                        </div>
                    </form>
                </Modal>)}
        </div>);
};
export default GroupDetail;
