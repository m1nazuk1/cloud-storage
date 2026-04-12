export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Б';

    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Сервер хранит LocalDateTime как момент в UTC (Docker). В JSON часто приходит без суффикса Z,
 * и браузер трактует это как локальное время — сдвиг на несколько часов. Добавляем Z для ISO без зоны.
 */
export function parseServerDateString(dateString: string | undefined | null): Date {
    if (dateString == null || dateString === '') {
        return new Date(NaN);
    }
    const s = String(dateString).trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
        return new Date(s.endsWith('Z') ? s : s + 'Z');
    }
    return new Date(s);
}

export const formatDate = (dateString: string): string => {
    const date = parseServerDateString(dateString);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatRelativeTime = (dateString: string): string => {
    const date = parseServerDateString(dateString);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'только что';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин. назад`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч. назад`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} дн. назад`;

    return formatDate(dateString);
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

export const getFileIcon = (fileType?: string | null): string => {
    if (fileType == null || fileType === '') {
        return '📎';
    }
    const icons: Record<string, string> = {
        pdf: '📕',
        doc: '📝',
        docx: '📝',
        txt: '📄',
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️',
        gif: '🖼️',
        mp4: '🎬',
        avi: '🎬',
        mov: '🎬',
        mp3: '🎵',
        wav: '🎵',
        zip: '📦',
        rar: '📦',
        '7z': '📦',
    };

    return icons[fileType.toLowerCase()] || '📎';
};

/** Безопасная подпись пользователя в списках (только строки — без падений React) */
export const formatUserListSubtitle = (u: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    username?: string | null;
}): string => {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    if (name) return name;
    if (u.email) return String(u.email);
    if (u.username) return String(u.username);
    return '';
};
