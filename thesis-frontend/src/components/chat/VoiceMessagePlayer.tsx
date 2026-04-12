import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import api from '../../api/axios';

type Props = {
    fileId: string;
    mimeType?: string;
    /** Сообщение «моё» — светлая тема плеера */
    mine: boolean;
};

const BAR_COUNT = 46;

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Амплитуды по сегментам для «волны» (0…1) */
function computePeaks(channelData: Float32Array, bars: number): number[] {
    const len = channelData.length;
    if (len === 0) return Array.from({ length: bars }, () => 0.35);
    const block = Math.max(1, Math.floor(len / bars));
    const peaks: number[] = [];
    for (let i = 0; i < bars; i++) {
        let sum = 0;
        const start = i * block;
        const end = Math.min(start + block, len);
        for (let j = start; j < end; j++) {
            sum += Math.abs(channelData[j]!);
        }
        peaks.push(sum / (end - start));
    }
    const max = Math.max(...peaks, 1e-6);
    return peaks.map((p) => Math.min(1, (p / max) * 0.85 + 0.15));
}

function placeholderPeaks(seed: string): number[] {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return Array.from({ length: BAR_COUNT }, (_, i) => {
        h = (h * 1103515245 + 12345 + i) >>> 0;
        return 0.2 + (h % 1000) / 1000 * 0.75;
    });
}

const VoiceMessagePlayer: React.FC<Props> = ({ fileId, mimeType, mine }) => {
    const [src, setSrc] = useState<string | null>(null);
    const [peaks, setPeaks] = useState<number[]>(() => placeholderPeaks(fileId));
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;

        (async () => {
            try {
                const res = await api.get<ArrayBuffer>(`/files/download/${fileId}`, { responseType: 'arraybuffer' });
                if (cancelled) return;
                const ab = res.data;
                const blob = new Blob([ab], {
                    type: mimeType || (res.headers['content-type'] as string) || 'audio/webm',
                });
                objectUrl = URL.createObjectURL(blob);
                setSrc(objectUrl);

                try {
                    const ctx = new AudioContext();
                    const buf = await ctx.decodeAudioData(ab.slice(0));
                    const ch = buf.getChannelData(0);
                    setPeaks(computePeaks(ch, BAR_COUNT));
                    await ctx.close();
                } catch {
                    setPeaks(placeholderPeaks(fileId));
                }
            } catch {
                if (!cancelled) setLoadError(true);
            }
        })();

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [fileId, mimeType]);

    useEffect(() => {
        const a = audioRef.current;
        if (!a || !src) return;
        const onTime = () => setCurrent(a.currentTime);
        a.addEventListener('timeupdate', onTime);
        return () => a.removeEventListener('timeupdate', onTime);
    }, [src]);

    const toggle = () => {
        const a = audioRef.current;
        if (!a || !src) return;
        if (a.paused) {
            void a.play();
        } else {
            a.pause();
        }
    };

    const onMeta = () => {
        const a = audioRef.current;
        if (a && Number.isFinite(a.duration)) {
            setDuration(a.duration);
        }
    };

    const onEnded = () => {
        setPlaying(false);
        setCurrent(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
    };

    const progress = duration > 0 ? Math.min(1, current / duration) : 0;

    const barBase = mine
        ? 'bg-white/35'
        : 'bg-slate-400/45 dark:bg-slate-500/50';
    const barPlayed = mine ? 'bg-white' : 'bg-indigo-500 dark:bg-indigo-400';

    if (loadError) {
        return <span className="text-xs opacity-80">Не удалось загрузить аудио</span>;
    }

    if (!src) {
        return (
            <div className="flex items-center gap-2 py-1 text-xs opacity-70">
                <span className="inline-block h-8 w-8 animate-pulse rounded-full bg-white/20" />
                <span>Загрузка…</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2.5 min-w-0 max-w-[min(100%,320px)] py-0.5">
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onLoadedMetadata={onMeta}
                onDurationChange={onMeta}
                onEnded={onEnded}
                onPause={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
                className="hidden"
            />
            <button
                type="button"
                onClick={toggle}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
                    mine
                        ? 'bg-white text-indigo-600 hover:bg-white/95'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500'
                }`}
                aria-label={playing ? 'Пауза' : 'Воспроизвести'}
            >
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 pl-0.5" />}
            </button>
            <div className="min-w-0 flex-1 flex flex-col gap-1">
                <div className="flex h-9 items-end gap-[2px] px-0.5" title="Голосовое сообщение">
                    {peaks.slice(0, BAR_COUNT).map((h, i) => {
                        const played = progress > i / BAR_COUNT;
                        const px = 4 + h * 26;
                        return (
                            <div
                                key={i}
                                className={`min-w-[2px] max-w-[3px] flex-1 rounded-full transition-colors duration-75 ${
                                    played ? barPlayed : barBase
                                }`}
                                style={{ height: `${px}px` }}
                            />
                        );
                    })}
                </div>
                <div
                    className={`flex justify-between gap-2 text-[11px] tabular-nums font-medium tracking-tight ${
                        mine ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    <span>{formatTime(current)}</span>
                    {duration > 0 && <span className="opacity-75">{formatTime(duration)}</span>}
                </div>
            </div>
        </div>
    );
};

export default VoiceMessagePlayer;
