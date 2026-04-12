import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cloud } from 'lucide-react';
const CLOUD_HALF = 34;
const MARGIN = 40;
function smoothstep(t: number): number {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
}
function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function cubicBezier(t: number, p0: {
    x: number;
    y: number;
}, p1: {
    x: number;
    y: number;
}, p2: {
    x: number;
    y: number;
}, p3: {
    x: number;
    y: number;
}): {
    x: number;
    y: number;
} {
    const u = 1 - t;
    const uu = u * u;
    const uuu = uu * u;
    const tt = t * t;
    const ttt = tt * t;
    return {
        x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
        y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
    };
}
function buildFlightKeyframes(fly: {
    x: number;
    y: number;
}): Keyframe[] {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2 - fly.x;
    const cy = H / 2 - fly.y;
    const cap = Math.min(W / 2 - MARGIN - CLOUD_HALF, H / 2 - MARGIN - CLOUD_HALF);
    const r = Math.min(cap, Math.max(110, Math.min(W, H) * 0.41));
    const entryX = cx + r;
    const entryY = cy;
    const p0 = { x: entryX, y: entryY };
    const p1 = { x: W * 0.52 - fly.x, y: H * 0.88 - fly.y };
    const p2 = { x: W * 0.06 - fly.x, y: H * 0.18 - fly.y };
    const p3 = { x: 0, y: 0 };
    const SAMPLES = 180;
    const frames: Keyframe[] = [];
    const uEntryEnd = 0.13;
    const uLoopEnd = 0.52;
    for (let i = 0; i <= SAMPLES; i++) {
        const u = i / SAMPLES;
        let tx: number;
        let ty: number;
        if (u < uEntryEnd) {
            const s = smoothstep(u / uEntryEnd);
            tx = entryX * s;
            ty = entryY * s;
        }
        else if (u < uLoopEnd) {
            const tt = (u - uEntryEnd) / (uLoopEnd - uEntryEnd);
            const theta = tt * 2 * Math.PI;
            tx = cx + r * Math.cos(theta);
            ty = cy + r * Math.sin(theta);
        }
        else {
            const tt = easeInOutCubic((u - uLoopEnd) / (1 - uLoopEnd));
            const p = cubicBezier(tt, p0, p1, p2, p3);
            tx = p.x;
            ty = p.y;
        }
        const breathe = 1 + 0.1 * Math.sin(u * Math.PI);
        const sway = 11 * Math.sin(u * Math.PI * 2) * (1 - u * 0.38);
        frames.push({
            transform: `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${breathe.toFixed(4)}) rotate(${sway.toFixed(2)}deg)`,
        });
    }
    return frames;
}
const BrandCloudButton: React.FC<{
    className?: string;
    iconClassName?: string;
    'aria-label'?: string;
}> = ({ className = '', iconClassName = 'h-6 w-6 text-white', 'aria-label': ariaLabel = 'Облако' }) => {
    const [fly, setFly] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const motionRef = useRef<HTMLDivElement>(null);
    const launch = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        const r = e.currentTarget.getBoundingClientRect();
        setFly({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }, []);
    const finish = useCallback(() => setFly(null), []);
    useEffect(() => {
        if (!fly || !motionRef.current)
            return undefined;
        const el = motionRef.current;
        const keyframes = buildFlightKeyframes(fly);
        const anim = el.animate(keyframes, {
            duration: 6200,
            easing: 'linear',
            fill: 'forwards',
        });
        anim.onfinish = () => finish();
        anim.oncancel = () => finish();
        return () => {
            anim.cancel();
        };
    }, [fly, finish]);
    const portal = fly && typeof document !== 'undefined'
        ? createPortal(<div className="fixed z-[300] pointer-events-none" style={{ left: fly.x, top: fly.y, transform: 'translate(-50%, -50%)' }} aria-hidden>
                      <div ref={motionRef} className="will-change-transform">
                          <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-500 shadow-2xl shadow-indigo-500/45 ring-4 ring-white/35 dark:ring-white/15">
                              <Cloud className="h-9 w-9 text-white drop-shadow-md" strokeWidth={1.75}/>
                          </div>
                      </div>
                  </div>, document.body)
        : null;
    return (<>
            <button type="button" className={className} aria-label={ariaLabel} onClick={launch}>
                <Cloud className={iconClassName} strokeWidth={1.75}/>
            </button>
            {portal}
        </>);
};
export default BrandCloudButton;
