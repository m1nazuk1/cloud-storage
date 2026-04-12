import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120_000,
});

/** Не дублировать toast: страницы и AuthContext сами показывают сообщения для этих запросов */
function shouldSkipGlobalErrorToast(config: { url?: string } | undefined): boolean {
    const url = config?.url ?? '';
    return (
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password') ||
        url.includes('/auth/activate')
    );
}

export function extractErrorMessage(data: unknown): string | undefined {
    if (data == null) {
        return undefined;
    }
    if (typeof data === 'string') {
        const t = data.trim();
        return t || undefined;
    }
    if (typeof data === 'object' && data !== null) {
        const o = data as Record<string, unknown>;
        if (typeof o.message === 'string') {
            return o.message;
        }
        if (typeof o.error === 'string' && typeof o.message !== 'string') {
            return o.error;
        }
        // Ошибки валидации: { "fieldName": "msg", ... } без поля message
        const entries = Object.entries(o).filter(
            ([k, v]) => k !== 'status' && k !== 'timestamp' && typeof v === 'string'
        );
        if (entries.length > 0) {
            return entries.map(([, v]) => v as string).join('; ');
        }
    }
    return undefined;
}

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const data = error.response?.data;
        const message =
            extractErrorMessage(data) ||
            error.message ||
            'Произошла ошибка';

        const path = window.location.pathname;
        const isPublicAuth =
            path.startsWith('/login') ||
            path.startsWith('/register') ||
            path.startsWith('/forgot-password') ||
            path.startsWith('/reset-password') ||
            path.startsWith('/activate');

        const status = error.response?.status;

        // Сеть / таймаут без ответа сервера
        if (!error.response && (error.code === 'ECONNABORTED' || error.message === 'Network Error')) {
            if (!shouldSkipGlobalErrorToast(error.config)) {
                toast.error('Нет связи с сервером. Проверьте сеть и попробуйте снова.');
            }
            return Promise.reject(error);
        }

        if (status !== 401 && !shouldSkipGlobalErrorToast(error.config)) {
            toast.error(message);
        }

        // Любой 401: сбрасываем сессию (в т.ч. на /login при «мертвом» токене после очистки БД)
        if (status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.dispatchEvent(new Event('auth:session-expired'));
            if (!isPublicAuth) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

/** Для catch в компонентах: всегда строка, никогда объект в UI */
export function getApiErrorMessage(error: unknown, fallback = 'Произошла ошибка'): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const data = (error as AxiosError).response?.data;
        const m = extractErrorMessage(data);
        if (m) return m;
    }
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
}

export default api;
