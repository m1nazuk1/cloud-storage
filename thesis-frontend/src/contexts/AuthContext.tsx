import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthResponse, User } from '../types';
import { userApi } from '../api/user';
import { authApi } from '../api/auth';
import { extractErrorMessage, getApiErrorMessage } from '../api/axios';
import { useToast } from './ToastContext';
import { queryClient } from '../queryClient';
import { notificationApi } from '../api/notifications';
import { statsApi } from '../api/stats';
import { activityApi } from '../api/activity';
import { groupApi } from '../api/group';
interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => Promise<User>;
    refreshUserData: () => Promise<User>;
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
    const clearSession = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);
    const refreshUserData = useCallback(async (): Promise<User> => {
        const response = await userApi.getProfile();
        localStorage.setItem('user', JSON.stringify(response));
        setUser(response);
        return response;
    }, []);
    const prefetchUserCaches = useCallback(async (userId: string) => {
        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: ['notifications', userId],
                queryFn: notificationApi.getNotifications,
            }),
            queryClient.prefetchQuery({
                queryKey: ['notifications', 'count', userId],
                queryFn: notificationApi.getUnreadCount,
            }),
            queryClient.prefetchQuery({
                queryKey: ['user-stats', userId],
                queryFn: statsApi.getUserStats,
            }),
            queryClient.prefetchQuery({
                queryKey: ['recent-activity', userId],
                queryFn: activityApi.getRecentActivity,
            }),
            queryClient.prefetchQuery({
                queryKey: ['groups', userId],
                queryFn: groupApi.getMyGroups,
            }),
        ]);
    }, []);
    useEffect(() => {
        const onSessionInvalid = () => {
            clearSession();
        };
        window.addEventListener('auth:session-expired', onSessionInvalid);
        return () => window.removeEventListener('auth:session-expired', onSessionInvalid);
    }, [clearSession]);
    useEffect(() => {
        let cancelled = false;
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                if (!cancelled) {
                    setIsLoading(false);
                }
                return;
            }
            try {
                const u = await refreshUserData();
                try {
                    await prefetchUserCaches(u.id);
                }
                catch {
                    void 0;
                }
            }
            catch (e) {
                const status = (e as {
                    response?: {
                        status?: number;
                    };
                })?.response?.status;
                if (status === 401 || status === 403) {
                    clearSession();
                }
            }
            finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };
        initAuth();
        return () => {
            cancelled = true;
        };
    }, [clearSession, refreshUserData, prefetchUserCaches]);
    const authResponseToUser = (authResponse: AuthResponse): User => {
        return {
            id: authResponse.id,
            email: authResponse.email,
            username: authResponse.username,
            firstName: authResponse.firstName || '',
            lastName: authResponse.lastName || '',
            enabled: authResponse.enabled !== false,
            registrationDate: new Date().toISOString(),
            roles: authResponse.roles || ['ROLE_USER']
        };
    };
    const login = async (emailOrUsername: string, password: string) => {
        setIsLoading(true);
        try {
            const response: AuthResponse = await authApi.login({
                emailOrUsername,
                password
            });
            localStorage.setItem('access_token', response.token);
            queryClient.clear();
            let loggedInUser: User;
            try {
                loggedInUser = await refreshUserData();
            }
            catch {
                loggedInUser = authResponseToUser(response);
                setUser(loggedInUser);
                localStorage.setItem('user', JSON.stringify(loggedInUser));
            }
            try {
                await prefetchUserCaches(loggedInUser.id);
            }
            catch {
                void 0;
            }
            toast.success('Вход выполнен');
        }
        catch (error: any) {
            console.error('Login error:', error);
            let message = 'Не удалось войти';
            if (!error.response) {
                message =
                    error.code === 'ECONNABORTED' || error.message === 'Network Error'
                        ? 'Нет связи с сервером. Проверьте сеть и попробуйте снова.'
                        : message;
            }
            else {
                const apiMsg = extractErrorMessage(error.response?.data);
                if (apiMsg) {
                    message = apiMsg;
                }
                else if (error.response?.status === 401) {
                    message = 'Неверный логин или пароль';
                }
                else if (error.response?.status === 403) {
                    message = 'Аккаунт не активирован. Проверьте почту';
                }
            }
            toast.error(message);
            throw new Error(message);
        }
        finally {
            setIsLoading(false);
        }
    };
    const register = async (data: any) => {
        try {
            await authApi.register(data);
        }
        catch (error: any) {
            let message = 'Ошибка регистрации';
            if (!error.response) {
                message =
                    error.code === 'ECONNABORTED' || error.message === 'Network Error'
                        ? 'Нет связи с сервером. Проверьте сеть и попробуйте снова.'
                        : message;
            }
            else {
                message = getApiErrorMessage(error, 'Ошибка регистрации');
            }
            toast.error(message);
            throw error;
        }
    };
    const logout = async () => {
        try {
            await authApi.logout();
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            queryClient.clear();
            setUser(null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            toast.success('Вы вышли из аккаунта');
        }
    };
    const updateUser = async (data: Partial<User>): Promise<User> => {
        setIsLoading(true);
        try {
            const updatedUser = await userApi.updateProfile(data);
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const mergedUser = { ...currentUser, ...updatedUser };
            localStorage.setItem('user', JSON.stringify(mergedUser));
            setUser(mergedUser);
            toast.success('Профиль обновлён');
            return mergedUser;
        }
        catch (error: any) {
            console.error('Update error:', error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<AuthContext.Provider value={{
            user,
            isLoading,
            login,
            register,
            logout,
            updateUser,
            refreshUserData
        }}>
            {children}
        </AuthContext.Provider>);
};
