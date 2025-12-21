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

    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    },

    refreshToken: async (): Promise<{ token: string }> => {
        const response = await api.post('/auth/refresh');
        return response.data;
    },
};