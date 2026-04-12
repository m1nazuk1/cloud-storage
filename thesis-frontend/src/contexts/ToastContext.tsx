import React, { createContext, useContext, ReactNode } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface ToastContextType {
    success: (message: string) => void;
    error: (message: string) => void;
    loading: (message: string) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
    // Добавляем для обратной совместимости
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

function toToastText(message: unknown): string {
    if (typeof message === 'string') {
        return message;
    }
    if (message == null) {
        return '';
    }
    if (typeof message === 'object' && message !== null && 'message' in message) {
        const m = (message as { message?: unknown }).message;
        if (typeof m === 'string') return m;
    }
    try {
        return JSON.stringify(message);
    } catch {
        return String(message);
    }
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const success = (message: string) => {
        toast.success(toToastText(message), {
            duration: 4000,
            position: 'top-right',
        });
    };

    const error = (message: string) => {
        toast.error(toToastText(message), {
            duration: 5000,
            position: 'top-right',
        });
    };

    const loading = (message: string) => {
        return toast.loading(toToastText(message), {
            position: 'top-right',
        });
    };

    const dismiss = (id: string) => {
        toast.dismiss(id);
    };

    const dismissAll = () => {
        toast.dismiss();
    };

    // Добавляем для обратной совместимости
    const showSuccess = (message: string) => success(message);
    const showError = (message: string) => error(message);

    return (
        <ToastContext.Provider value={{
            success,
            error,
            loading,
            dismiss,
            dismissAll,
            showSuccess,
            showError
        }}>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: '#1e293b',
                        borderRadius: '0.875rem',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        boxShadow: '0 18px 40px -12px rgba(49, 46, 129, 0.25)',
                        backdropFilter: 'blur(12px)',
                    },
                    success: {
                        iconTheme: {
                            primary: '#059669',
                            secondary: '#ffffff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#dc2626',
                            secondary: '#ffffff',
                        },
                    },
                }}
            />
        </ToastContext.Provider>
    );
};