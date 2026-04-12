export interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
    registrationDate: string;
    roles: string[];
    /** Относительный путь с сервера, напр. /api/user/avatar/{id} */
    avatarUrl?: string | null;
}

export interface AuthResponse {
    token: string;
    type: string;
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    roles: string[];
    /** С сервера после логина/регистрации; полный профиль лучше брать из GET /user/profile */
    enabled?: boolean;
}

export interface LoginRequest {
    emailOrUsername: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export interface WorkGroup {
    id: string;
    name: string;
    description?: string;
    creationDate: string;
    creatorUsername: string;
    memberCount: number; // Добавляем
    fileCount: number;   // Добавляем
    /** Личные настройки участника (с сервера в GET /group/my) */
    notificationsMuted?: boolean;
    pinned?: boolean;
    accentColor?: string | null;
}

export interface GroupDetail {
    id: string;
    name: string;
    description?: string;
    creationDate: string;
    creatorUsername: string; // Должно быть так
    inviteToken?: string;
    memberCount?: number;
    fileCount?: number;
}

export interface GroupStats {
    id: string;
    name: string;
    memberCount: number;
    fileCount: number;
    creator: string;
    creationDate: string;
}

export interface Membership {
    id: string;
    user: User;
    role: 'CREATOR' | 'ADMIN' | 'MEMBER';
    joinedDate: string;
}

export interface GroupCreateRequest {
    name: string;
    description?: string;
}

export interface GroupUpdateRequest {
    name?: string;
    description?: string;
    regenerateToken?: boolean;
}

/** Соответствует FileDTO.PublicUser с бэкенда */
export interface FileUploaderInfo {
    id: string;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
}

export interface FileMetadata {
    id: string;
    originalName: string;
    storedName?: string;
    fileSize: number;
    fileType: string;
    mimeType: string;
    uploadDate: string;
    lastModified?: string;
    uploader?: FileUploaderInfo;
    deleted?: boolean;
    formattedSize?: string;
    fileExtension?: string;
    groupId?: string;
    /** Версия метаданных (оптимистическая блокировка при переименовании/удалении). */
    version?: number;
    /** LOCAL — диск сервера; OBJECT_STORE — MinIO/S3. */
    storageBackend?: string;
}

export interface FileHistory {
    id: string;
    changeType: 'UPLOADED' | 'DELETED' | 'RENAMED' | 'UPDATED' | 'DOWNLOADED';
    changeDate: string;
    additionalInfo?: string;
    changedBy: User;
    file: FileMetadata;
}

export type ChatMessageKind = 'TEXT' | 'IMAGE' | 'AUDIO' | 'STICKER' | 'FILE';

export interface ChatMessage {
    id: string;
    content?: string | null;
    messageKind?: ChatMessageKind | string;
    timestamp: string;
    sender: User;
    /** В API может быть только groupId, без полного WorkGroup */
    group?: WorkGroup;
    groupId?: string;
    attachment?: FileMetadata;
    edited: boolean;
    editTimestamp?: string;
}

export interface ChatMessageRequest {
    content?: string;
    groupId: string;
    attachmentId?: string;
    stickerCode?: string;
}

export interface Notification {
    id: string;
    type:
        | 'FILE_ADDED'
        | 'FILE_DELETED'
        | 'FILE_UPDATED'
        | 'USER_JOINED'
        | 'USER_LEFT'
        | 'USER_REMOVED'
        | 'GROUP_UPDATED'
        | 'CHAT_MENTION';
    message: string;
    createdDate: string;
    read: boolean;
    readDate?: string;
    user?: User;
    group?: Pick<WorkGroup, 'id' | 'name' | 'description'>;
    relatedFile?: FileMetadata;
    relatedUser?: User;
    timeAgo?: string;
}

export interface ApiError {
    message: string;
    status?: number;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}