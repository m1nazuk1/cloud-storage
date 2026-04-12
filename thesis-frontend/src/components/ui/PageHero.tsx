import React from 'react';
import { Sparkles } from 'lucide-react';

interface PageHeroProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    badge?: string;
    children?: React.ReactNode;
    className?: string;
    /** Без анимации блика (для вложенных экранов) */
    quiet?: boolean;
}

/**
 * Герой-блок с градиентом и лёгким «переливом» — единый стиль с главной.
 */
const PageHero: React.FC<PageHeroProps> = ({
    title,
    subtitle,
    badge = 'Thesis Cloud',
    children,
    className = '',
    quiet = false,
}) => {
    return (
        <div
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/25 bg-gradient-to-br from-indigo-600 via-violet-600 to-teal-700 px-4 py-6 sm:px-8 sm:py-8 text-white shadow-xl shadow-indigo-900/25 ${className}`}
        >
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-teal-400/25 blur-2xl" />
            {!quiet && (
                <div
                    className="pointer-events-none absolute inset-0 opacity-50 bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.18)_45%,rgba(255,255,255,0.08)_55%,transparent_65%)] bg-[length:220%_100%] animate-shimmer"
                    aria-hidden
                />
            )}
            <div className="relative z-[1]">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 mb-3">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    {badge}
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight break-words">{title}</h1>
                {subtitle != null && subtitle !== '' && (
                    <p className="mt-2 text-sm sm:text-base text-white/88 max-w-3xl leading-relaxed">{subtitle}</p>
                )}
                {children != null && (
                    <div className="mt-5 sm:mt-6 w-full flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHero;
