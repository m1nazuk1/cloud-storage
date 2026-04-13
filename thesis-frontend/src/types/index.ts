export interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
    registrationDate: string;
    roles: string[];
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
    memberCount: number;
    fileCount: number;
    notificationsMuted?: boolean;
    pinned?: boolean;
    accentColor?: string | null;
    coverFileId?: string | null;
}
export interface GroupDetail {
    id: string;
    name: string;
    description?: string;
    creationDate: string;
    creatorUsername: string;
    inviteToken?: string;
    memberCount?: number;
    fileCount?: number;
    coverFileId?: string | null;
}
export interface GroupStats {
    id: string;
    name: string;
    memberCount: number;
    fileCount: number;
    creator: string;
    creationDate: string;
    canPinMessages?: boolean;
    isCreator?: boolean;
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
    version?: number;
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
export interface FileNote {
    id: string;
    body: string;
    createdAt: string;
    authorId: string;
    authorUsername: string;
}
export interface FileRevision {
    id: string;
    fileVersionSnapshot: number;
    sizeBytes: number;
    mimeType?: string;
    originalNameSnapshot: string;
    hasTextSnapshot: boolean;
    createdAt: string;
    createdById: string;
    createdByUsername: string;
}
export type ChatMessageKind = 'TEXT' | 'IMAGE' | 'AUDIO' | 'STICKER' | 'FILE';
export interface ChatMessage {
    id: string;
    content?: string | null;
    messageKind?: ChatMessageKind | string;
    timestamp: string;
    sender: User;
    group?: WorkGroup;
    groupId?: string;
    attachment?: FileMetadata;
    edited: boolean;
    editTimestamp?: string;
    replyToId?: string | null;
    pinned?: boolean;
    pinnedAt?: string | null;
}
export interface ChatMessageRequest {
    content?: string;
    groupId: string;
    attachmentId?: string;
    stickerCode?: string;
    replyToId?: string;
}
export interface Notification {
    id: string;
    type: 'FILE_ADDED' | 'FILE_DELETED' | 'FILE_UPDATED' | 'USER_JOINED' | 'USER_LEFT' | 'USER_REMOVED' | 'GROUP_UPDATED' | 'CHAT_MENTION' | 'CHAT_REPLY';
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
