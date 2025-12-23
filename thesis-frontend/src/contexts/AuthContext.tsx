import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
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
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    const refreshUserData = async () => {
        try {
            const userData = await userApi.getProfile();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
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

    const login = async (email: string, password: string) => {
        try {
            // Убираем присваивание неиспользуемой переменной response
            await authApi.login({ emailOrUsername: email, password });
            await refreshUserData();
            toast.success('Logged in successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed');
            throw error;
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
        try {
            const updatedUser = await userApi.updateProfile(data);
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            toast.success('Profile updated successfully!');
            return updatedUser; // Возвращаем обновленного пользователя
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
            throw error;
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