import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {AuthResponse, User} from '../types';
import { userApi } from '../api/user';
import { authApi } from '../api/auth';
import { useToast } from './ToastContext';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => Promise<User>; // Возвращаем User, а не void
    refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Метод для обновления данных пользователя
    const refreshUserData = async () => {
        try {
            const response = await userApi.getProfile();
            localStorage.setItem('user', JSON.stringify(response));
            setUser(response);
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
    };



    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    await refreshUserData();
                } catch (error) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const authResponseToUser = (authResponse: AuthResponse): User => {
        return {
            id: authResponse.id,
            email: authResponse.email,
            username: authResponse.username,
            firstName: authResponse.firstName || '',
            lastName: authResponse.lastName || '',
            enabled: true, // По умолчанию true после успешного логина
            registrationDate: new Date().toISOString(), // Или возьмите из response если есть
            roles: authResponse.roles || ['ROLE_USER']
        };
    };

    const login = async (emailOrUsername: string, password: string) => {
        setIsLoading(true);
        try {
            // Используем LoginRequest объект
            const response: AuthResponse = await authApi.login({
                emailOrUsername,
                password
            });

            // Сохраняем токен
            localStorage.setItem('access_token', response.token);

            // Конвертируем AuthResponse в User
            const userData = authResponseToUser(response);

            // Сохраняем пользователя
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            toast.success('Login successful!');
        } catch (error: any) {
            console.error('Login error:', error);

            let message = 'Login failed';
            if (error.response?.status === 401) {
                message = 'Invalid username or password';
            } else if (error.response?.status === 403) {
                message = 'Account not activated. Check your email';
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            }

            toast.error(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: any) => {
        try {
            await authApi.register(data);
            toast.success('Registration successful! Please check your email to activate your account.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            toast.success('Logged out successfully');
        }
    };

    const updateUser = async (data: Partial<User>): Promise<User> => {
        setIsLoading(true);
        try {
            const updatedUser = await userApi.updateProfile(data);

            // Обновляем данные в localStorage
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const mergedUser = { ...currentUser, ...updatedUser };

            localStorage.setItem('user', JSON.stringify(mergedUser));
            setUser(mergedUser);

            toast.success('Profile updated successfully!');
            return mergedUser;
        } catch (error: any) {
            console.error('Update error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            register,
            logout,
            updateUser,
            refreshUserData
        }}>
            {children}
        </AuthContext.Provider>
    );
};