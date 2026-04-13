import React from 'react';
import { Loader2 } from 'lucide-react';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    fullWidth?: boolean;
}
const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', loading = false, fullWidth = false, disabled, className = '', ...props }) => {
    const baseClasses = 'touch-manipulation inline-flex items-center justify-center font-medium rounded-xl transition-[box-shadow,filter,background-color] duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-[1.02] active:brightness-[0.97] antialiased';
    const variants = {
        primary: 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] text-white hover:brightness-110 focus:ring-indigo-500 shadow-md shadow-indigo-500/25',
        secondary: 'bg-white/95 text-slate-700 border border-slate-200/90 hover:bg-indigo-50/80 hover:border-indigo-200 focus:ring-indigo-500 shadow-sm dark:bg-slate-800/95 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700',
        ghost: 'text-slate-600 hover:bg-indigo-50/80 hover:text-indigo-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white focus:ring-indigo-400',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    const sizes = {
        sm: 'px-3 py-2.5 sm:py-1.5 text-sm',
        md: 'px-4 py-3 sm:py-2 text-sm',
        lg: 'px-6 py-3.5 sm:py-3 text-base',
    };
    const widthClass = fullWidth ? 'w-full' : '';
    return (<button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`} disabled={disabled || loading} {...props}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            {children}
        </button>);
};
export default Button;
