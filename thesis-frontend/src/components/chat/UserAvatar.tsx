import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { User } from '../../types';

type Props = {
    user?: Pick<User, 'id' | 'avatarUrl' | 'username'>;
    className?: string;
    label?: string;
};

/** Круглая аватарка: JWT через axios → blob URL (обычный img с /api/... не передаёт заголовок). */
const UserAvatar: React.FC<Props> = ({ user, className = 'h-9 w-9', label }) => {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.avatarUrl || !user?.id) {
            setSrc(null);
            return;
        }
        let objectUrl: string | null = null;
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get<Blob>(`/user/avatar/${user.id}`, { responseType: 'blob' });
                if (cancelled) return;
                objectUrl = URL.createObjectURL(res.data);
                setSrc(objectUrl);
            } catch {
                if (!cancelled) setSrc(null);
            }
        })();
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [user?.id, user?.avatarUrl]);

    const initial = (user?.username?.[0] || '?').toUpperCase();

    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold overflow-hidden ring-2 ring-white/30 dark:ring-slate-600/50 ${className}`}
            title={label || user?.username}
            aria-hidden={!!label}
        >
            {src ? (
                <img src={src} alt="" className="h-full w-full object-cover" />
            ) : (
                <span className="select-none">{initial}</span>
            )}
        </span>
    );
};

export default UserAvatar;
