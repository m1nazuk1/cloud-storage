import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

type Props = {
    fileId: string;
    mimeType?: string;
    className?: string;
};

export const ChatImageAttachment: React.FC<Props> = ({ fileId, className = '' }) => {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get<Blob>(`/files/download/${fileId}`, { responseType: 'blob' });
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
    }, [fileId]);

    if (!src) {
        return <span className="text-xs opacity-80">Загрузка…</span>;
    }

    return (
        <a href={src} download target="_blank" rel="noreferrer" className={`block max-w-[min(100%,280px)] ${className}`}>
            <img src={src} alt="" className="rounded-lg max-h-64 w-auto object-contain" />
        </a>
    );
};

