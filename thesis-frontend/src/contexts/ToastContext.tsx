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

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const success = (message: string) => {
        toast.success(message, {
            duration: 4000,
            position: 'top-right',
        });
    };

    const error = (message: string) => {
        toast.error(message, {
            duration: 5000,
            position: 'top-right',
        });
    };

    const loading = (message: string) => {
        return toast.loading(message, {
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
                        background: '#1f2937',
                        color: '#f9fafb',
                        borderRadius: '0.5rem',
                        border: '1px solid #374151',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#ffffff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#ffffff',
                        },
                    },
                }}
            />
        </ToastContext.Provider>
    );
};