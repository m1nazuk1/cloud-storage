import api from './axios';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        const { token } = response.data;
        localStorage.setItem('access_token', token);
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    },

    activate: async (code: string): Promise<void> => {
        await api.get(`/auth/activate/${code}`);
    },

    requestPasswordReset: async (email: string): Promise<void> => {
        await api.post('/auth/forgot-password', null, { params: { email } });
    },

    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    },
    resetPassword: async (token: string, newPassword: string): Promise<void> => {
        await api.post('/auth/reset-password', null, {
            params: {token, newPassword}
        });
    },

    refreshToken: async (): Promise<{ token: string }> => {
        const response = await api.post('/auth/refresh');
        return response.data;
    },
};