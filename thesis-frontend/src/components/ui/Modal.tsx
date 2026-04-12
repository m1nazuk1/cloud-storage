import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className = '' }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex min-h-full items-end justify-center bg-slate-900/55 px-4 pb-4 pt-10 backdrop-blur-sm dark:bg-black/70 sm:items-center sm:p-4 animate-fade-in overflow-y-auto overscroll-contain"
            onClick={handleBackdropClick}
        >
            <div
                className={`relative mx-auto w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl border border-slate-200/90 dark:border-slate-600 shadow-2xl shadow-indigo-950/15 dark:shadow-black/50 sm:rounded-2xl max-h-[min(92dvh,900px)] sm:max-h-[90vh] overflow-y-auto animate-popover-in motion-reduce:animate-none ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;