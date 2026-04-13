import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './queryClient';
import App from './App';
import i18n from './i18n/config';
import './styles/globals.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <ToastProvider>
                        <App />
                    </ToastProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </I18nextProvider>
    </React.StrictMode>);
