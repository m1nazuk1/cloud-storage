import type { Notification } from '../types';
export type NotificationGroupFilter = 'all' | 'files' | 'members' | 'group' | 'chat';
export function notificationMatchesFilter(n: Notification, filter: NotificationGroupFilter): boolean {
    if (filter === 'all')
        return true;
    const t = n.type;
    switch (filter) {
        case 'files':
            return t === 'FILE_ADDED' || t === 'FILE_DELETED' || t === 'FILE_UPDATED';
        case 'members':
            return t === 'USER_JOINED' || t === 'USER_LEFT' || t === 'USER_REMOVED';
        case 'group':
            return t === 'GROUP_UPDATED';
        case 'chat':
            return t === 'CHAT_MENTION';
        default:
            return true;
    }
}
export function filterNotifications(items: Notification[], filter: NotificationGroupFilter): Notification[] {
    return items.filter((n) => notificationMatchesFilter(n, filter));
}
