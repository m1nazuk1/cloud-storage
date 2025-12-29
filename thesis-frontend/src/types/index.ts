export interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
    registrationDate: string;
    roles: string[];
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

export interface FileMetadata {
    id: string;
    originalName: string;
    storedName: string;
    fileSize: number;
    fileType: string;
    mimeType: string;
    uploadDate: string;
    lastModified?: string;
    uploader: User;
    deleted: boolean;
    formattedSize?: string;
    fileExtension?: string;
}

export interface FileHistory {
    id: string;
    changeType: 'UPLOADED' | 'DELETED' | 'RENAMED' | 'UPDATED' | 'DOWNLOADED';
    changeDate: string;
    additionalInfo?: string;
    changedBy: User;
    file: FileMetadata;
}

export interface ChatMessage {
    id: string;
    content: string;
    timestamp: string;
    sender: User;
    group: WorkGroup;
    attachment?: FileMetadata;
    edited: boolean;
    editTimestamp?: string;
}

export interface ChatMessageRequest {
    content: string;
    groupId: string;
    attachmentId?: string;
}

export interface Notification {
    id: string;
    type: 'FILE_ADDED' | 'FILE_DELETED' | 'FILE_UPDATED' | 'USER_JOINED' | 'USER_LEFT' | 'USER_REMOVED' | 'GROUP_UPDATED';
    message: string;
    createdDate: string;
    read: boolean;
    readDate?: string;
    user: User;
    group: WorkGroup;
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