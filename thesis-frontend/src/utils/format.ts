import i18n from '../i18n/config';

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0)
        return `0 ${i18n.t('units.B')}`;
    const k = 1024;
    const sizes = [i18n.t('units.B'), i18n.t('units.KB'), i18n.t('units.MB'), i18n.t('units.GB'), i18n.t('units.TB')];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
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
        return i18n.t('common.emDash');
    }
    const lng = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
    const localeMap: Record<string, string> = {
        ru: 'ru-RU',
        en: 'en-US',
        be: 'be-BY',
        ka: 'ka-GE',
        az: 'az-AZ',
        zh: 'zh-CN',
        ar: 'ar',
        es: 'es-ES',
    };
    const locale = localeMap[lng] || `${lng}-${lng.toUpperCase()}`;
    return date.toLocaleString(locale, {
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
        return i18n.t('common.emDash');
    }
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60)
        return i18n.t('time.justNow');
    if (diffInSeconds < 3600)
        return i18n.t('time.minAgo', { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400)
        return i18n.t('time.hoursAgo', { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 604800)
        return i18n.t('time.daysAgo', { count: Math.floor(diffInSeconds / 86400) });
    return formatDate(dateString);
};
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength)
        return text;
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
export const formatUserListSubtitle = (u: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    username?: string | null;
}): string => {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    if (name)
        return name;
    if (u.email)
        return String(u.email);
    if (u.username)
        return String(u.username);
    return '';
};
