import React from 'react';
interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    style?: React.CSSProperties;
}
const Card: React.FC<CardProps> = ({ children, className = '', hover = true, style }) => {
    return (<div style={style} className={`rounded-2xl border border-slate-200/80 dark:border-slate-700/90 bg-white/90 dark:bg-slate-800/85 backdrop-blur-sm shadow-lg shadow-slate-900/5 dark:shadow-black/30 ${hover
            ? 'hover:shadow-xl hover:shadow-slate-900/10 dark:hover:shadow-indigo-950/40 hover:border-indigo-200/60 dark:hover:border-indigo-500/30 hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]'
            : ''} transition-all duration-300 ease-out ${className}`}>
            {children}
        </div>);
};
interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}
export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
    return (<div className={`px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100/90 dark:border-slate-700/80 ${className}`}>
            {children}
        </div>);
};
interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}
export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
    return (<div className={`px-4 py-4 sm:px-6 ${className}`}>
            {children}
        </div>);
};
export default Card;
