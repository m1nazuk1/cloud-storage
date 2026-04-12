import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ArrowLeft, Image as ImageIcon, Mic, Send, Smile, Trash2, X, MoreVertical, Pencil, MessageSquare, } from 'lucide-react';
import { chatApi } from '../../api/chat';
import { groupApi } from '../../api/group';
import { fileApi } from '../../api/file';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ChatMessage, ChatMessageRequest, User } from '../../types';
import Button from '../../components/ui/Button';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import PageHero from '../../components/ui/PageHero';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import UserAvatar from '../../components/chat/UserAvatar';
import { ChatImageAttachment } from '../../components/chat/ChatAttachmentMedia';
import VoiceMessagePlayer from '../../components/chat/VoiceMessagePlayer';
import { formatDate } from '../../utils/format';
function wsBaseUrl(): string {
    const raw = import.meta.env.VITE_WS_URL as string | undefined;
    if (raw !== undefined && raw !== '') {
        return raw.replace(/\/$/, '');
    }
    return '';
}
const STICKERS = ['👍', '❤️', '😂', '🔥', '🎉', '✅', '💡', '👏', '🙏', '😊', '🎯', '⭐'];
function mentionMatch(text: string): {
    start: number;
    filter: string;
} | null {
    const re = /(^|\s)@([\w.]*)$/;
    const m = re.exec(text);
    if (!m)
        return null;
    const at = text.lastIndexOf('@');
    return { start: at, filter: m[2] };
}
function renderTextWithMentions(text: string, members: User[], mine: boolean): React.ReactNode {
    const parts = text.split(/(@[\w.]+)/g);
    const nameSet = new Set(members.map((u) => u.username.toLowerCase()));
    const mentionClass = mine
        ? 'font-semibold text-amber-100 dark:text-amber-200'
        : 'font-semibold text-indigo-700 dark:text-indigo-300';
    return parts.map((part, i) => {
        if (part.startsWith('@')) {
            const uname = part.slice(1);
            const isMember = nameSet.has(uname.toLowerCase());
            return (<span key={i} className={isMember ? mentionClass : undefined}>
                    {part}
                </span>);
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
    });
}
const GroupChat: React.FC = () => {
    const { groupId } = useParams<{
        groupId: string;
    }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { error: toastError, success } = useToast();
    const queryClient = useQueryClient();
    const [text, setText] = useState('');
    const clientRef = useRef<Client | null>(null);
    const seenIds = useRef<Set<string>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesScrollRef = useRef<HTMLDivElement>(null);
    const lastMsgMenuButtonRef = useRef<HTMLButtonElement | null>(null);
    const [actionMenuCoords, setActionMenuCoords] = useState<{
        top: number;
        left: number;
    } | null>(null);
    const [showStickers, setShowStickers] = useState(false);
    const [mentionPick, setMentionPick] = useState<{
        start: number;
        filter: string;
    } | null>(null);
    const [recording, setRecording] = useState(false);
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
    const [editTarget, setEditTarget] = useState<ChatMessage | null>(null);
    const [editDraft, setEditDraft] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const { data: group, isLoading: groupLoading } = useQuery({
        queryKey: ['group', groupId],
        queryFn: () => groupApi.getGroup(groupId!),
        enabled: !!groupId,
    });
    const { data: membersRaw = [] } = useQuery({
        queryKey: ['group', groupId, 'members'],
        queryFn: () => groupApi.getGroupMembers(groupId!),
        enabled: !!groupId,
    });
    const members: User[] = Array.isArray(membersRaw) ? membersRaw : [];
    const { data: messages = [], isLoading: messagesLoading, } = useQuery({
        queryKey: ['chat', groupId],
        queryFn: () => chatApi.getGroupMessages(groupId!),
        enabled: !!groupId,
    });
    const mergeMessage = useCallback((msg: ChatMessage) => {
        if (!msg?.id || seenIds.current.has(msg.id)) {
            return;
        }
        seenIds.current.add(msg.id);
        queryClient.setQueryData<ChatMessage[]>(['chat', groupId], (prev) => {
            const list = prev ?? [];
            if (list.some((m) => m.id === msg.id)) {
                return list;
            }
            return [...list, msg].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
    }, [groupId, queryClient]);
    const replaceMessage = useCallback((msg: ChatMessage) => {
        if (!msg?.id)
            return;
        seenIds.current.add(msg.id);
        queryClient.setQueryData<ChatMessage[]>(['chat', groupId], (prev) => {
            const list = prev ?? [];
            const idx = list.findIndex((m) => m.id === msg.id);
            if (idx === -1) {
                return [...list, msg].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            }
            const next = [...list];
            next[idx] = msg;
            return next;
        });
    }, [groupId, queryClient]);
    const removeMessage = useCallback((id: string) => {
        seenIds.current.delete(id);
        queryClient.setQueryData<ChatMessage[]>(['chat', groupId], (prev) => (prev ?? []).filter((m) => m.id !== id));
    }, [groupId, queryClient]);
    useEffect(() => {
        seenIds.current = new Set(messages.map((m) => m.id));
    }, [messages]);
    const updateActionMenuPosition = useCallback((btn: HTMLElement) => {
        const MENU_W = 176;
        const MENU_H = 112;
        const GAP = 6;
        const pad = 8;
        const r = btn.getBoundingClientRect();
        let left = r.right - MENU_W;
        left = Math.max(pad, Math.min(left, window.innerWidth - MENU_W - pad));
        const spaceBelow = window.innerHeight - r.bottom - GAP;
        const spaceAbove = r.top - GAP;
        let top = spaceBelow >= MENU_H || spaceBelow >= spaceAbove ? r.bottom + GAP : r.top - MENU_H - GAP;
        top = Math.max(pad, Math.min(top, window.innerHeight - MENU_H - pad));
        setActionMenuCoords({ top, left });
    }, []);
    useEffect(() => {
        const el = messagesScrollRef.current;
        if (!el)
            return;
        const id = window.requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
        return () => window.cancelAnimationFrame(id);
    }, [messages]);
    useLayoutEffect(() => {
        if (!openActionMenuId || !lastMsgMenuButtonRef.current)
            return;
        updateActionMenuPosition(lastMsgMenuButtonRef.current);
    }, [messages, openActionMenuId, updateActionMenuPosition]);
    useEffect(() => {
        if (!openActionMenuId)
            return;
        const btn = lastMsgMenuButtonRef.current;
        const scrollEl = messagesScrollRef.current;
        if (!btn)
            return;
        const sync = () => updateActionMenuPosition(btn);
        window.addEventListener('resize', sync);
        scrollEl?.addEventListener('scroll', sync, { passive: true });
        return () => {
            window.removeEventListener('resize', sync);
            scrollEl?.removeEventListener('scroll', sync);
        };
    }, [openActionMenuId, updateActionMenuPosition]);
    useEffect(() => {
        const onDocDown = (e: MouseEvent) => {
            const t = e.target as HTMLElement | null;
            if (t?.closest?.('[data-chat-msg-menu]'))
                return;
            setOpenActionMenuId(null);
        };
        if (!openActionMenuId)
            return;
        document.addEventListener('mousedown', onDocDown);
        return () => document.removeEventListener('mousedown', onDocDown);
    }, [openActionMenuId]);
    useEffect(() => {
        if (!openActionMenuId) {
            setActionMenuCoords(null);
            lastMsgMenuButtonRef.current = null;
        }
    }, [openActionMenuId]);
    const sendMutation = useMutation({
        mutationFn: (data: ChatMessageRequest) => chatApi.sendMessage(data),
        onSuccess: (msg) => {
            mergeMessage(msg);
            setText('');
            setShowStickers(false);
            setMentionPick(null);
        },
        onError: (e: unknown) => {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response?.data?.message
                : undefined;
            toastError(msg || 'Не удалось отправить сообщение');
        },
    });
    useEffect(() => {
        const mm = mentionMatch(text);
        setMentionPick(mm);
    }, [text]);
    useEffect(() => {
        if (!groupId || !user)
            return;
        const token = localStorage.getItem('access_token');
        if (!token)
            return;
        const base = wsBaseUrl();
        const sockUrl = `${base}/ws`;
        const client = new Client({
            webSocketFactory: () => new SockJS(sockUrl) as unknown as WebSocket,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onStompError: (frame) => {
                console.error('STOMP error', frame);
            },
            onWebSocketError: (e) => {
                console.error('WebSocket error', e);
            },
        });
        client.onConnect = () => {
            client.subscribe(`/topic/group.${groupId}.chat`, (message: IMessage) => {
                try {
                    const body = JSON.parse(message.body) as ChatMessage;
                    mergeMessage(body);
                }
                catch {
                    void 0;
                }
            });
            client.subscribe(`/topic/group.${groupId}.chat.update`, (message: IMessage) => {
                try {
                    const body = JSON.parse(message.body) as ChatMessage;
                    replaceMessage(body);
                }
                catch {
                    void 0;
                }
            });
            client.subscribe(`/topic/group.${groupId}.chat.delete`, (message: IMessage) => {
                try {
                    const body = JSON.parse(message.body) as {
                        messageId?: string;
                    };
                    if (body?.messageId) {
                        removeMessage(body.messageId);
                    }
                }
                catch {
                    void 0;
                }
            });
        };
        client.activate();
        clientRef.current = client;
        return () => {
            client.deactivate();
            clientRef.current = null;
        };
    }, [groupId, user, mergeMessage, replaceMessage, removeMessage]);
    const handleSendText = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || !groupId)
            return;
        sendMutation.mutate({ content: trimmed, groupId });
    };
    const insertMention = (u: User) => {
        if (!mentionPick || !groupId)
            return;
        const { start, filter } = mentionPick;
        const before = text.slice(0, start);
        const after = text.slice(start + 1 + filter.length);
        const next = `${before}@${u.username} ${after}`;
        setText(next);
        setMentionPick(null);
        requestAnimationFrame(() => inputRef.current?.focus());
    };
    const filteredMentionUsers = mentionPick
        ? members.filter((m) => {
            const q = mentionPick.filter.toLowerCase();
            return m.username.toLowerCase().includes(q);
        })
        : [];
    const sendSticker = (code: string) => {
        if (!groupId)
            return;
        sendMutation.mutate({ groupId, stickerCode: code });
    };
    const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f || !groupId)
            return;
        try {
            const meta = await fileApi.uploadChatMedia(groupId, f);
            sendMutation.mutate({ groupId, attachmentId: meta.id, content: '' });
            success('Фото отправлено');
        }
        catch {
            toastError('Не удалось отправить фото');
        }
    };
    const stopRecording = () => {
        const mr = mediaRecorderRef.current;
        if (mr && mr.state !== 'inactive') {
            mr.stop();
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setRecording(false);
    };
    const startRecording = async () => {
        if (!groupId || recording)
            return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            mediaChunksRef.current = [];
            const mime = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : MediaRecorder.isTypeSupported('audio/mp4')
                    ? 'audio/mp4'
                    : '';
            const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
            mr.ondataavailable = (ev) => {
                if (ev.data.size)
                    mediaChunksRef.current.push(ev.data);
            };
            mr.onstop = async () => {
                const blob = new Blob(mediaChunksRef.current, { type: mr.mimeType || 'audio/webm' });
                stream.getTracks().forEach((t) => t.stop());
                const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('mp4') ? 'm4a' : 'webm';
                const file = new File([blob], `voice.${ext}`, { type: blob.type });
                try {
                    const meta = await fileApi.uploadChatMedia(groupId, file);
                    sendMutation.mutate({ groupId, attachmentId: meta.id, content: '' });
                    success('Голосовое отправлено');
                }
                catch {
                    toastError('Не удалось отправить голосовое');
                }
            };
            mr.start(200);
            mediaRecorderRef.current = mr;
            setRecording(true);
        }
        catch {
            toastError('Нет доступа к микрофону');
        }
    };
    const deleteMutation = useMutation({
        mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
        onSuccess: (_, messageId) => {
            removeMessage(messageId);
            setOpenActionMenuId(null);
            success('Сообщение удалено');
        },
        onError: () => toastError('Не удалось удалить сообщение'),
    });
    const editMutation = useMutation({
        mutationFn: ({ messageId, text }: {
            messageId: string;
            text: string;
        }) => chatApi.editMessage(messageId, text),
        onSuccess: () => {
            setEditTarget(null);
            setEditDraft('');
            success('Сообщение обновлено');
            queryClient.invalidateQueries({ queryKey: ['chat', groupId] });
        },
        onError: () => toastError('Не удалось изменить сообщение'),
    });
    const openEditModal = (m: ChatMessage) => {
        setEditTarget(m);
        setEditDraft(m.content || '');
        setOpenActionMenuId(null);
    };
    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTarget)
            return;
        const t = editDraft.trim();
        if (!t || t === (editTarget.content || '').trim()) {
            setEditTarget(null);
            return;
        }
        editMutation.mutate({ messageId: editTarget.id, text: t });
    };
    const renderMessageBody = (m: ChatMessage, mine: boolean) => {
        const kind = m.messageKind || 'TEXT';
        if (kind === 'STICKER') {
            return <span className="text-4xl leading-none select-none">{m.content || '·'}</span>;
        }
        if (kind === 'IMAGE' && m.attachment?.id) {
            return (<div className="space-y-1">
                    <ChatImageAttachment fileId={m.attachment.id}/>
                    {m.content ? (<div className="text-sm whitespace-pre-wrap break-words opacity-95">
                            {renderTextWithMentions(m.content, members, mine)}
                        </div>) : null}
                </div>);
        }
        if (kind === 'AUDIO' && m.attachment?.id) {
            return (<div className="space-y-1 min-w-0">
                    <VoiceMessagePlayer fileId={m.attachment.id} mimeType={m.attachment.mimeType} mine={mine}/>
                    {m.content ? (<div className="text-sm whitespace-pre-wrap break-words opacity-95">
                            {renderTextWithMentions(m.content, members, mine)}
                        </div>) : null}
                </div>);
        }
        if (kind === 'FILE' && m.attachment?.id) {
            return (<div className="text-sm">
                    <span className="opacity-90">Файл: {m.attachment.originalName}</span>
                </div>);
        }
        return (<div className="text-sm whitespace-pre-wrap break-words">
                {renderTextWithMentions(m.content || '', members, mine)}
            </div>);
    };
    if (!groupId) {
        return null;
    }
    if (groupLoading || messagesLoading) {
        return (<div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent"/>
            </div>);
    }
    if (!group) {
        return (<div className="text-center py-12">
                <p className="text-gray-600 mb-4">Группа не найдена</p>
                <Button variant="primary" onClick={() => navigate('/groups')}>
                    К списку групп
                </Button>
            </div>);
    }
    return (<div className="space-y-5 max-w-4xl mx-auto min-w-0 pb-8">
            <PageHero badge="Чат" title={<span className="break-words">
                        Чат: {group.name}
                    </span>} subtitle={<span>
                        <Link to={`/groups/${groupId}`} className="text-white/95 underline decoration-white/40 hover:decoration-white font-medium">
                            Страница группы
                        </Link>
                    </span>}>
                <Button variant="secondary" className="w-full justify-center sm:w-auto bg-white/95 text-indigo-900 border-white/50 dark:bg-slate-800/95 dark:text-slate-100 dark:border-slate-600" onClick={() => navigate(`/groups/${groupId}`)}>
                    <ArrowLeft className="h-5 w-5 mr-2 shrink-0"/>
                    Назад к группе
                </Button>
            </PageHero>

            <Card hover={false} className="overflow-hidden shadow-xl shadow-slate-900/5 dark:shadow-black/40 ring-1 ring-slate-200/80 dark:ring-slate-700/60">
                <CardHeader className="bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/70 dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/50 border-b border-slate-200/70 dark:border-slate-700/80">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300">
                            <MessageSquare className="h-5 w-5"/>
                        </span>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Переписка</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Сообщения видны всем участникам группы</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-6 pt-5 bg-gradient-to-b from-slate-50/40 to-white dark:from-slate-950/20 dark:to-slate-950">
                    <div className="rounded-[1.35rem] border border-slate-200/70 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-slate-50/80 to-slate-100/60 p-3 sm:p-4 dark:border-slate-700/60 dark:from-indigo-950/25 dark:via-slate-900/50 dark:to-slate-950/80 shadow-inner">
                    <div ref={messagesScrollRef} className="space-y-3 sm:space-y-4 max-h-[min(62dvh,560px)] sm:max-h-[min(60vh,560px)] overflow-y-auto mb-4 pr-1 sm:pr-2 -mr-1 touch-pan-y scroll-smooth [scrollbar-width:thin]">
                        {messages.length === 0 ? (<div className="text-center py-14 px-4">
                                <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Пока тихо здесь</p>
                                <p className="text-slate-500 dark:text-slate-500 text-sm mt-1.5 max-w-xs mx-auto">
                                    Напишите первое сообщение или отправьте стикер снизу.
                                </p>
                            </div>) : (messages.map((m) => {
            const mine = m.sender?.id === user?.id;
            const kind = m.messageKind || 'TEXT';
            return (<div key={m.id} className={`flex gap-2 sm:gap-3 items-end ${mine ? 'justify-end' : 'justify-start'}`}>
                                        {!mine && (<UserAvatar user={m.sender} className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-white dark:ring-slate-800 shadow-md shrink-0"/>)}
                                        <div className={`max-w-[min(92%,22rem)] sm:max-w-[76%] min-w-0 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 transition-[box-shadow,transform] ${mine
                    ? 'rounded-br-md bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-900/20 ring-1 ring-white/20'
                    : 'rounded-bl-md bg-white/95 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-600/60 shadow-md shadow-slate-900/[0.06]'}`}>
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className={`text-[11px] uppercase tracking-wide flex flex-wrap gap-x-1.5 gap-y-0.5 items-baseline min-w-0 flex-1 ${mine ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    <span className="font-semibold normal-case tracking-normal">
                                                        {m.sender?.username ?? 'Участник'}
                                                    </span>
                                                    <span className="opacity-45">·</span>
                                                    <span className="tabular-nums opacity-85 text-[10px] sm:text-[11px]">
                                                        {formatDate(m.timestamp)}
                                                    </span>
                                                    {m.edited ? (<span className={`normal-case text-[10px] font-medium ${mine ? 'text-amber-100/90' : 'text-slate-400 dark:text-slate-500'}`}>
                                                            (изменено)
                                                        </span>) : null}
                                                </div>
                                                {mine && (<div className="relative shrink-0 -mr-1 -mt-0.5" data-chat-msg-menu>
                                                        <button type="button" aria-expanded={openActionMenuId === m.id} aria-haspopup="menu" aria-label="Действия с сообщением" className={`rounded-lg p-1.5 transition-colors ${mine
                        ? 'text-white/85 hover:bg-white/15 hover:text-white'
                        : ''}`} onClick={(e) => {
                        e.stopPropagation();
                        if (openActionMenuId === m.id) {
                            setOpenActionMenuId(null);
                        }
                        else {
                            lastMsgMenuButtonRef.current = e.currentTarget;
                            updateActionMenuPosition(e.currentTarget);
                            setOpenActionMenuId(m.id);
                        }
                    }}>
                                                            <MoreVertical className="h-4 w-4"/>
                                                        </button>
                                                    </div>)}
                                            </div>
                                            <div className={kind === 'TEXT'
                    ? 'text-[15px] leading-relaxed'
                    : 'text-sm leading-normal'}>
                                                {renderMessageBody(m, mine)}
                                            </div>
                                        </div>
                                        {mine && (<UserAvatar user={m.sender} className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-white dark:ring-slate-800 shadow-md shrink-0"/>)}
                                    </div>);
        }))}
                    </div>
                    </div>

                    {mentionPick && filteredMentionUsers.length > 0 && (<div className="mb-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg max-h-36 overflow-y-auto">
                            {filteredMentionUsers.slice(0, 8).map((u) => (<button key={u.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => insertMention(u)}>
                                    <UserAvatar user={u} className="h-7 w-7"/>
                                    <span>{u.username}</span>
                                </button>))}
                        </div>)}

                    {showStickers && (<div className="mb-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 flex flex-wrap gap-2">
                            {STICKERS.map((s) => (<button key={s} type="button" className="text-2xl p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700" onClick={() => sendSticker(s)}>
                                    {s}
                                </button>))}
                            <button type="button" className="ml-auto p-1 text-slate-500" onClick={() => setShowStickers(false)} aria-label="Закрыть стикеры">
                                <X className="h-5 w-5"/>
                            </button>
                        </div>)}

                    <form onSubmit={handleSendText} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3 sm:p-4 shadow-sm dark:border-slate-600/70 dark:bg-slate-900/40">
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                                <ImageIcon className="h-5 w-5 text-slate-600 dark:text-slate-300"/>
                                <input type="file" accept="image/*" className="hidden" onChange={onPickImage}/>
                            </label>
                            <button type="button" className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 p-2 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setShowStickers((v) => !v)}>
                                <Smile className="h-5 w-5 text-slate-600 dark:text-slate-300"/>
                            </button>
                            <button type="button" className={`inline-flex items-center justify-center rounded-xl border p-2 ${recording
            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700'
            : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`} onClick={() => (recording ? stopRecording() : startRecording())} title={recording ? 'Отпустите для отправки' : 'Запись голоса'}>
                                <Mic className={`h-5 w-5 ${recording ? 'text-rose-600 animate-pulse' : 'text-slate-600 dark:text-slate-300'}`}/>
                            </button>
                            {recording && (<span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                    Идёт запись — нажмите ещё раз, чтобы отправить
                                </span>)}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                            <Input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение… Упомяните участника: @ник" className="flex-1 min-w-0 w-full" maxLength={2000}/>
                            <Button type="submit" variant="primary" loading={sendMutation.isPending} disabled={!text.trim() || sendMutation.isPending} className="w-full shrink-0 sm:w-auto justify-center">
                                <Send className="h-4 w-4 mr-2 shrink-0"/>
                                Отправить
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {openActionMenuId &&
            actionMenuCoords &&
            (() => {
                const menuMsg = messages.find((x) => x.id === openActionMenuId);
                if (!menuMsg)
                    return null;
                const menuKind = menuMsg.messageKind || 'TEXT';
                return createPortal(<div role="menu" data-chat-msg-menu style={{
                        position: 'fixed',
                        top: actionMenuCoords.top,
                        left: actionMenuCoords.left,
                        zIndex: 70,
                    }} className="min-w-[11rem] overflow-hidden rounded-xl border border-slate-200/95 bg-white py-1 text-slate-800 shadow-2xl dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                            {menuKind === 'TEXT' && (<button type="button" role="menuitem" className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700/80" onClick={() => openEditModal(menuMsg)}>
                                    <Pencil className="h-4 w-4 shrink-0 opacity-80"/>
                                    Изменить
                                </button>)}
                            <button type="button" role="menuitem" className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50" onClick={() => {
                        setOpenActionMenuId(null);
                        if (window.confirm('Удалить это сообщение?')) {
                            deleteMutation.mutate(menuMsg.id);
                        }
                    }}>
                                <Trash2 className="h-4 w-4 shrink-0 opacity-80"/>
                                Удалить
                            </button>
                        </div>, document.body);
            })()}

            <Modal isOpen={!!editTarget} onClose={() => {
            setEditTarget(null);
            setEditDraft('');
        }}>
                <form onSubmit={submitEdit} className="p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Изменить сообщение</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Доступно только для текстовых сообщений.
                    </p>
                    <textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value)} className="w-full min-h-[132px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100" maxLength={2000} placeholder="Текст сообщения…" autoFocus/>
                    <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="ghost" onClick={() => {
            setEditTarget(null);
            setEditDraft('');
        }}>
                            Отмена
                        </Button>
                        <Button type="submit" variant="primary" loading={editMutation.isPending} disabled={!editDraft.trim() || editMutation.isPending}>
                            Сохранить
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default GroupChat;
