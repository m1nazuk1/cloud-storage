import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { userApi } from '../api/user';
import { authApi } from '../api/auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => Promise<void>;
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

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const userData = await userApi.getProfile();
                    setUser(userData);
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
            await authApi.login({ emailOrUsername: email, password });
            const userData = await userApi.getProfile();
            setUser(userData);
        } catch (error) {
            throw error;
        }
    };

    const register = async (data: any) => {
        try {
            await authApi.register(data);
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
        }
    };

    const updateUser = async (data: Partial<User>) => {
        try {
            const updatedUser = await userApi.updateProfile(data);
            setUser(updatedUser);
        } catch (error) {
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};