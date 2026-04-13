import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

type Props = {
    fileId: string;
    className?: string;
    rounded?: 'lg' | 'md';
};
const GroupCoverThumb: React.FC<Props> = ({ fileId, className = '', rounded = 'lg' }) => {
    const [src, setSrc] = useState<string | null>(null);
    useEffect(() => {
        let cancelled = false;
        let objectUrl: string | null = null;
        (async () => {
            try {
                const res = await api.get<Blob>(`/files/download/${fileId}`, { responseType: 'blob' });
                if (cancelled)
                    return;
                objectUrl = URL.createObjectURL(res.data);
                setSrc(objectUrl);
            }
            catch {
                if (!cancelled)
                    setSrc(null);
            }
        })();
        return () => {
            cancelled = true;
            if (objectUrl)
                URL.revokeObjectURL(objectUrl);
        };
    }, [fileId]);
    const r = rounded === 'md' ? 'rounded-md' : 'rounded-lg';
    if (!src) {
        return (<div className={`${r} bg-slate-200/70 dark:bg-slate-700/60 ring-1 ring-slate-200/80 dark:ring-slate-600/50 ${className}`} aria-hidden/>);
    }
    return (<img src={src} alt="" className={`${r} object-cover ring-1 ring-black/5 dark:ring-white/10 ${className}`}/>);
};
export default GroupCoverThumb;
