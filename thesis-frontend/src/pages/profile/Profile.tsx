import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Calendar, Shield, Key, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userUpdateSchema, passwordChangeSchema } from '../../utils/validation';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { z } from "zod";
import { userApi } from '../../api/user';
import toast from "react-hot-toast";

type ProfileFormData = {
    firstName?: string;
    lastName?: string;
    username?: string;
};

type PasswordFormData = {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
};

const Profile: React.FC = () => {
    const { user, updateUser, refreshUserData } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({
        id: '',
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        registrationDate: '',
        roles: [] as string[],
        enabled: false
    });

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(userUpdateSchema),
    });

    const handleRefreshProfile = async () => {
        try {
            await refreshUserData();
            toast.success('Profile data refreshed!');
        } catch (error) {
            console.error('Failed to refresh profile:', error);
        }
    };

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordChangeSchema.extend({
            confirmPassword: z.string().min(6, 'Confirm password is required'),
        }).refine((data) => data.newPassword === data.confirmPassword, {
            message: "Passwords don't match",
            path: ["confirmPassword"],
        })),
    });

    // Загружаем свежие данные пользователя при загрузке компонента
    const loadUserData = async () => {
        try {
            setIsLoading(true);
            const userData = await userApi.getProfile();

            setUserInfo({
                id: userData.id || '',
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                username: userData.username || '',
                email: userData.email || '',
                registrationDate: userData.registrationDate || '',
                roles: userData.roles || [],
                enabled: userData.enabled || false
            });

            // Устанавливаем значения в форму
            profileForm.reset({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                username: userData.username || '',
            });

        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            setUserInfo({
                id: user.id || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                username: user.username || '',
                email: user.email || '',
                registrationDate: user.registrationDate || '',
                roles: user.roles || [],
                enabled: user.enabled || false
            });

            profileForm.reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                username: user.username || '',
            });
            setIsLoading(false);
        } else {
            loadUserData();
        }
    }, [user]);

    const onProfileSubmit = async (data: ProfileFormData) => {
        console.log('=== FORM SUBMIT DEBUG ===');
        console.log('1. Form data received:', data);
        console.log('2. Current userInfo:', userInfo);

        // Детальная проверка изменений
        const changes = {
            firstName: {
                current: userInfo.firstName,
                new: data.firstName,
                changed: data.firstName !== userInfo.firstName
            },
            lastName: {
                current: userInfo.lastName,
                new: data.lastName,
                changed: data.lastName !== userInfo.lastName
            },
            username: {
                current: userInfo.username,
                new: data.username,
                changed: data.username !== userInfo.username
            }
        };

        console.log('3. Detailed changes:', changes);

        const hasChanges = changes.firstName.changed || changes.lastName.changed || changes.username.changed;
        console.log('4. Has changes?', hasChanges);

        if (!hasChanges) {
            console.log('5. No changes detected, skipping...');
            setProfileMessage({
                type: 'error',
                text: 'No changes to save'
            });
            setIsUpdating(false);
            return;
        }

        setIsUpdating(true);
        setProfileMessage(null);

        try {
            // Подготавливаем данные для отправки
            const updateData: Partial<ProfileFormData> = {};

            if (changes.firstName.changed && data.firstName !== undefined) {
                updateData.firstName = data.firstName;
            }
            if (changes.lastName.changed && data.lastName !== undefined) {
                updateData.lastName = data.lastName;
            }
            if (changes.username.changed && data.username !== undefined) {
                updateData.username = data.username;
            }

            console.log('6. Update data to send:', updateData);
            console.log('7. Is updateData empty?', Object.keys(updateData).length === 0);

            if (Object.keys(updateData).length === 0) {
                console.log('8. No data to update after filtering');
                setProfileMessage({
                    type: 'info',
                    text: 'No changes to save'
                });
                setIsUpdating(false);
                return;
            }

            // Вызываем updateUser из контекста
            const updatedUser = await updateUser(updateData);
            console.log('9. Server response:', updatedUser);

            // Обновляем локальное состояние
            setUserInfo(prev => ({
                ...prev,
                firstName: updatedUser.firstName || prev.firstName,
                lastName: updatedUser.lastName || prev.lastName,
                username: updatedUser.username || prev.username,
            }));

            // НЕ сбрасываем форму здесь! Это скроет изменения
            setProfileMessage({
                type: 'success',
                text: 'Profile updated successfully!'
            });

            setTimeout(() => setProfileMessage(null), 3000);

        } catch (error: any) {
            console.error('10. Update error:', error);

            let errorMessage = 'Failed to update profile';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setProfileMessage({
                type: 'error',
                text: errorMessage
            });

            await refreshUserData();
        } finally {
            setIsUpdating(false);
            console.log('=== FORM SUBMIT COMPLETE ===');
        }
    };

    const onPasswordSubmit = async (data: PasswordFormData) => {
        try {
            setIsUpdating(true);
            setPasswordMessage(null);

            console.log('Changing password...');

            // Вызываем реальный API метод смены пароля
            await userApi.changePassword(data.oldPassword, data.newPassword);

            setPasswordMessage({
                type: 'success',
                text: 'Password updated successfully!'
            });

            passwordForm.reset({
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            setTimeout(() => setPasswordMessage(null), 3000);

        } catch (error: any) {
            console.error('Password change error:', error);

            let errorMessage = 'Failed to update password';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setPasswordMessage({
                type: 'error',
                text: errorMessage
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Invalid date';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (

        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <Button
                variant="secondary"
                onClick={handleRefreshProfile}
                className="flex items-center"
                title="Refresh profile data"
            >
                <RefreshCw className="mr-2 h-5 w-5" />
                Refresh Profile
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center mb-6">
                                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                                    <User className="h-8 w-8 text-primary-600" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-semibold text-gray-900">{userInfo.username}</h3>
                                    <p className="text-sm text-gray-500">{userInfo.email}</p>
                                    {userInfo.enabled ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                      Account Active
                    </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                      Pending Activation
                    </span>
                                    )}
                                </div>
                            </div>

                            <nav className="space-y-1">
                                <button
                                    onClick={() => {
                                        setActiveTab('profile');
                                        setProfileMessage(null);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                                        activeTab === 'profile'
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <User className="inline-block mr-2 h-4 w-4" />
                                    Profile Information
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('security');
                                        setPasswordMessage(null);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                                        activeTab === 'security'
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <Key className="inline-block mr-2 h-4 w-4" />
                                    Security
                                </button>
                            </nav>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardContent className="p-6">
                            <h4 className="font-semibold text-gray-900 mb-4">Account Details</h4>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                                    <p className="text-sm text-gray-900 font-medium">
                                        {userInfo.firstName || userInfo.lastName
                                            ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
                                            : 'Not set'}
                                    </p>
                                </div>
                                <div className="flex items-start text-sm">
                                    <Mail className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-900 break-all">{userInfo.email}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                    <span className="text-gray-900">
                    Joined {formatDate(userInfo.registrationDate)}
                  </span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Shield className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                    <span className="text-gray-900">
                    {userInfo.roles.length > 0
                        ? userInfo.roles.map(role =>
                            role.replace('ROLE_', '')).join(', ')
                        : 'User'}
                  </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">User ID</p>
                                    <p className="text-xs text-gray-500 font-mono truncate">{userInfo.id}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main content */}
                <div className="lg:col-span-3">
                    {activeTab === 'profile' ? (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                                    {profileForm.formState.isDirty && !isUpdating && (
                                        <span className="text-sm text-amber-600 font-medium animate-pulse">
                      ✏️ You have unsaved changes
                    </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {profileMessage && (
                                    <div className={`mb-4 p-3 rounded-md flex items-center animate-fade-in ${
                                        profileMessage.type === 'success'
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                        {profileMessage.type === 'success' ? (
                                            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                                        )}
                                        <span className="text-sm">{profileMessage.text}</span>
                                    </div>
                                )}

                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    First Name
                                                </label>
                                                <span className="text-xs text-gray-500">
                          Current: <span className="font-medium">{userInfo.firstName || 'Not set'}</span>
                        </span>
                                            </div>
                                            <Input
                                                register={profileForm.register('firstName')} // Передаем как prop
                                                error={profileForm.formState.errors.firstName?.message}
                                                placeholder="Enter your first name"
                                                disabled={isUpdating}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Last Name
                                                </label>
                                                <span className="text-xs text-gray-500">
                          Current: <span className="font-medium">{userInfo.lastName || 'Not set'}</span>
                        </span>
                                            </div>
                                            <Input
                                                register={profileForm.register('lastName')}
                                                error={profileForm.formState.errors.lastName?.message}
                                                placeholder="Enter your last name"
                                                disabled={isUpdating}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Username
                                            </label>
                                            <span className="text-xs text-gray-500">
                        Current: <span className="font-medium">{userInfo.username}</span>
                      </span>
                                        </div>
                                        <Input
                                            register={profileForm.register('username')}
                                            error={profileForm.formState.errors.username?.message}
                                            placeholder="Enter your username"
                                            disabled={isUpdating}
                                        />
                                        {profileForm.formState.errors.username && (
                                            <p className="mt-1 text-xs text-red-600">
                                                Username must be unique and at least 3 characters
                                            </p>
                                        )}
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <h4 className="font-medium text-gray-700 mb-2">Preview</h4>
                                        <p className="text-sm text-gray-600">
                                            Your profile will appear as:
                                        </p>
                                        <div className="mt-2 p-3 bg-white rounded border border-gray-300 shadow-sm">
                                            <p className="font-medium text-gray-900">
                                                {profileForm.watch('firstName') || userInfo.firstName || ''} {profileForm.watch('lastName') || userInfo.lastName || ''}
                                                {(!profileForm.watch('firstName') && !userInfo.firstName && !profileForm.watch('lastName') && !userInfo.lastName) && 'Not set'}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                @{profileForm.watch('username') || userInfo.username}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-200">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => {
                                                profileForm.reset({
                                                    firstName: userInfo.firstName || '',
                                                    lastName: userInfo.lastName || '',
                                                    username: userInfo.username || '',
                                                });
                                                setProfileMessage(null);
                                            }}
                                            disabled={!profileForm.formState.isDirty || isUpdating}
                                            className="mr-3"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            loading={isUpdating}
                                            disabled={!profileForm.formState.isDirty || isUpdating}
                                            className="min-w-[120px]"
                                        >
                                            {isUpdating ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                            </CardHeader>
                            <CardContent>
                                {passwordMessage && (
                                    <div className={`mb-4 p-3 rounded-md flex items-center animate-fade-in ${
                                        passwordMessage.type === 'success'
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                        {passwordMessage.type === 'success' ? (
                                            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                                        )}
                                        <span className="text-sm">{passwordMessage.text}</span>
                                    </div>
                                )}

                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                                    <Input
                                        label="Current Password"
                                        type="password"
                                        register={passwordForm.register('oldPassword')}
                                        error={passwordForm.formState.errors.oldPassword?.message}
                                        placeholder="Enter your current password"
                                        disabled={isUpdating}
                                    />

                                    <Input
                                        label="New Password"
                                        type="password"
                                        register={passwordForm.register('newPassword')}
                                        error={passwordForm.formState.errors.newPassword?.message}
                                        placeholder="Enter new password (min. 6 characters)"
                                        disabled={isUpdating}
                                    />

                                    <Input
                                        label="Confirm New Password"
                                        type="password"
                                        register={passwordForm.register('confirmPassword')}
                                        error={passwordForm.formState.errors.confirmPassword?.message}
                                        placeholder="Confirm your new password"
                                        disabled={isUpdating}
                                    />

                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h4 className="font-medium text-blue-700 mb-2">Password Requirements</h4>
                                        <ul className="text-sm text-blue-600 space-y-1">
                                            <li className="flex items-center">
                                                <div className={`h-2 w-2 rounded-full mr-2 ${passwordForm.watch('newPassword')?.length >= 6 ? 'bg-green-500' : 'bg-blue-300'}`} />
                                                At least 6 characters long
                                            </li>
                                            <li className="flex items-center">
                                                <div className={`h-2 w-2 rounded-full mr-2 ${passwordForm.watch('newPassword') && passwordForm.watch('confirmPassword') && passwordForm.watch('newPassword') === passwordForm.watch('confirmPassword') ? 'bg-green-500' : 'bg-blue-300'}`} />
                                                New passwords must match
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-200">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => {
                                                passwordForm.reset({
                                                    oldPassword: '',
                                                    newPassword: '',
                                                    confirmPassword: ''
                                                });
                                                setPasswordMessage(null);
                                            }}
                                            disabled={isUpdating}
                                            className="mr-3"
                                        >
                                            Clear
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            loading={isUpdating}
                                            disabled={isUpdating}
                                            className="min-w-[140px]"
                                        >
                                            {isUpdating ? 'Updating...' : 'Update Password'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;