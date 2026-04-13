import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { User as UserIcon, Mail, Calendar, Shield, Key, CheckCircle, AlertCircle, RefreshCw, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types';
import { createUserUpdateSchema, createProfilePasswordFormSchema } from '../../utils/validation';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHero from '../../components/ui/PageHero';
import Input from '../../components/ui/Input';
import { userApi } from '../../api/user';
import toast from "react-hot-toast";
import UserAvatar from '../../components/chat/UserAvatar';
import { formatDate as formatDateDisplay } from '../../utils/format';
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
    const { t } = useTranslation();
    const userUpdateSchema = useMemo(() => createUserUpdateSchema(t), [t]);
    const profilePasswordSchema = useMemo(() => createProfilePasswordFormSchema(t), [t]);
    const { user, updateUser, refreshUserData } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [profileMessage, setProfileMessage] = useState<{
        type: 'success' | 'error' | 'info';
        text: string;
    } | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
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
        enabled: false,
        avatarUrl: null as string | null | undefined,
    });
    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(userUpdateSchema),
    });
    const handleRefreshProfile = async () => {
        try {
            const userData = await refreshUserData();
            applyProfileFromUser(userData);
            toast.success(t('profile.msg.refreshed'));
        }
        catch (error) {
            console.error('Failed to refresh profile:', error);
        }
    };
    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(profilePasswordSchema),
    });
    const applyProfileFromUser = (userData: User) => {
        setUserInfo({
            id: userData.id || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            username: userData.username || '',
            email: userData.email || '',
            registrationDate: userData.registrationDate || '',
            roles: userData.roles || [],
            enabled: userData.enabled !== false,
            avatarUrl: userData.avatarUrl,
        });
        profileForm.reset({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            username: userData.username || '',
        });
    };
    const loadUserData = async () => {
        try {
            setIsLoading(true);
            const userData = await refreshUserData();
            applyProfileFromUser(userData);
        }
        catch (error) {
            console.error('Error loading user data:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setIsLoading(false);
            return;
        }
        void loadUserData();
    }, [user?.id]);
    const onProfileSubmit = async (data: ProfileFormData) => {
        console.log('=== FORM SUBMIT DEBUG ===');
        console.log('1. Form data received:', data);
        console.log('2. Current userInfo:', userInfo);
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
                text: t('profile.msg.noChanges')
            });
            setIsUpdating(false);
            return;
        }
        setIsUpdating(true);
        setProfileMessage(null);
        try {
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
                    text: t('profile.msg.noChanges')
                });
                setIsUpdating(false);
                return;
            }
            const updatedUser = await updateUser(updateData);
            console.log('9. Server response:', updatedUser);
            setUserInfo(prev => ({
                ...prev,
                firstName: updatedUser.firstName || prev.firstName,
                lastName: updatedUser.lastName || prev.lastName,
                username: updatedUser.username || prev.username,
            }));
            setProfileMessage({
                type: 'success',
                text: t('profile.msg.saved')
            });
            setTimeout(() => setProfileMessage(null), 3000);
        }
        catch (error: any) {
            console.error('10. Update error:', error);
            let errorMessage = t('profile.msg.saveError');
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            else if (error.message) {
                errorMessage = error.message;
            }
            setProfileMessage({
                type: 'error',
                text: errorMessage
            });
            await refreshUserData();
        }
        finally {
            setIsUpdating(false);
            console.log('=== FORM SUBMIT COMPLETE ===');
        }
    };
    const onPasswordSubmit = async (data: PasswordFormData) => {
        try {
            setIsUpdating(true);
            setPasswordMessage(null);
            console.log('Changing password...');
            await userApi.changePassword(data.oldPassword, data.newPassword);
            setPasswordMessage({
                type: 'success',
                text: t('profile.msg.passwordOk')
            });
            passwordForm.reset({
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setTimeout(() => setPasswordMessage(null), 3000);
        }
        catch (error: any) {
            console.error('Password change error:', error);
            let errorMessage = t('profile.msg.passwordError');
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            else if (error.message) {
                errorMessage = error.message;
            }
            setPasswordMessage({
                type: 'error',
                text: errorMessage
            });
        }
        finally {
            setIsUpdating(false);
        }
    };
    const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file)
            return;
        try {
            setIsUpdating(true);
            await userApi.uploadAvatar(file);
            const fresh = await refreshUserData();
            applyProfileFromUser(fresh);
            toast.success(t('profile.msg.avatarOk'));
        }
        catch {
            toast.error(t('profile.msg.avatarFail'));
        }
        finally {
            setIsUpdating(false);
        }
    };
    const handleRemoveAvatar = async () => {
        if (!window.confirm(t('profile.confirmRemoveAvatar')))
            return;
        try {
            setIsUpdating(true);
            await userApi.deleteAvatar();
            const fresh = await refreshUserData();
            applyProfileFromUser(fresh);
            toast.success(t('profile.msg.avatarRemoved'));
        }
        catch {
            toast.error(t('profile.msg.avatarRemoveFail'));
        }
        finally {
            setIsUpdating(false);
        }
    };
    if (isLoading) {
        return (<div className="flex justify-center items-center h-64">
                <div className="loading-spinner scale-125"/>
            </div>);
    }
    return (<div className="space-y-6 min-w-0">
            <PageHero badge={t('profile.badge')} title={t('profile.title')} subtitle={t('profile.subtitle')}>
                <Button variant="secondary" onClick={handleRefreshProfile} className="w-full justify-center sm:w-auto flex items-center bg-white/95 text-indigo-900 border-white/50 dark:bg-slate-800/95 dark:text-slate-100 dark:border-slate-600 shadow-md" title={t('profile.refreshTitle')}>
                    <RefreshCw className="mr-2 h-5 w-5 shrink-0"/>
                    {t('profile.refresh')}
                </Button>
            </PageHero>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center mb-6 gap-4">
                                <div className="relative shrink-0">
                                    <UserAvatar user={{
            id: userInfo.id,
            username: userInfo.username,
            avatarUrl: userInfo.avatarUrl,
        }} className="h-16 w-16 ring-2 ring-indigo-200/50 dark:ring-indigo-500/30"/>
                                    <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-500 transition-colors" title={t('profile.uploadPhoto')}>
                                        <Camera className="h-4 w-4"/>
                                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarFile} disabled={isUpdating}/>
                                    </label>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{userInfo.username}</h3>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">{userInfo.email}</p>
                                    {userInfo.avatarUrl && (<button type="button" onClick={handleRemoveAvatar} disabled={isUpdating} className="mt-1 text-xs text-rose-600 dark:text-rose-400 hover:underline">
                                            {t('profile.removePhoto')}
                                        </button>)}
                                    {userInfo.enabled ? (<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-emerald-900/45 dark:text-emerald-200 mt-1">
                      {t('profile.active')}
                    </span>) : (<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-amber-900/40 dark:text-amber-200 mt-1">
                      {t('profile.pendingActivation')}
                    </span>)}
                                </div>
                            </div>

                            <nav className="space-y-1">
                                <button onClick={() => {
            setActiveTab('profile');
            setProfileMessage(null);
        }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${activeTab === 'profile'
            ? 'bg-indigo-50 text-indigo-800 shadow-sm border border-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-500/30'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                                    <UserIcon className="inline-block mr-2 h-4 w-4"/>
                                    {t('profile.tabProfile')}
                                </button>
                                <button onClick={() => {
            setActiveTab('security');
            setPasswordMessage(null);
        }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${activeTab === 'security'
            ? 'bg-indigo-50 text-indigo-800 shadow-sm border border-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-500/30'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                                    <Key className="inline-block mr-2 h-4 w-4"/>
                                    {t('profile.tabSecurity')}
                                </button>
                            </nav>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardContent className="p-6">
                            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">{t('profile.accountSection')}</h4>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{t('profile.fullName')}</p>
                                    <p className="text-sm text-gray-900 dark:text-slate-100 font-medium">
                                        {userInfo.firstName || userInfo.lastName
            ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
            : t('profile.notSet')}
                                    </p>
                                </div>
                                <div className="flex items-start text-sm">
                                    <Mail className="h-4 w-4 text-gray-400 dark:text-slate-500 mr-2 mt-0.5 flex-shrink-0"/>
                                    <span className="text-gray-900 dark:text-slate-100 break-all">{userInfo.email}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400 dark:text-slate-500 mr-2 flex-shrink-0"/>
                                    <span className="text-gray-900 dark:text-slate-100">
                    {t('profile.registration')} {formatDateDisplay(userInfo.registrationDate)}
                  </span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Shield className="h-4 w-4 text-gray-400 dark:text-slate-500 mr-2 flex-shrink-0"/>
                                    <span className="text-gray-900 dark:text-slate-100">
                    {userInfo.roles.length > 0
            ? userInfo.roles.map(role => role.replace('ROLE_', '')).join(', ')
            : t('profile.roleUser')}
                  </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">ID</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-500 font-mono truncate">{userInfo.id}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                
                <div className="lg:col-span-3">
                    {activeTab === 'profile' ? (<Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('profile.profileData')}</h3>
                                    {profileForm.formState.isDirty && !isUpdating && (<span className="text-sm text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                      {t('profile.unsaved')}
                    </span>)}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {profileMessage && (<div className={`mb-4 p-3 rounded-lg flex items-center animate-fade-in ${profileMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/60'
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/35 dark:text-red-300 dark:border-red-800/50'}`}>
                                        {profileMessage.type === 'success' ? (<CheckCircle className="h-5 w-5 mr-2 flex-shrink-0"/>) : (<AlertCircle className="h-5 w-5 mr-2 flex-shrink-0"/>)}
                                        <span className="text-sm">{profileMessage.text}</span>
                                    </div>)}

                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                                    {t('profile.firstName')}
                                                </label>
                                                <span className="text-xs text-gray-500 dark:text-slate-400">
                          {t('profile.currentValue')} <span className="font-medium">{userInfo.firstName || t('profile.notSet')}</span>
                        </span>
                                            </div>
                                            <Input register={profileForm.register('firstName')} error={profileForm.formState.errors.firstName?.message} placeholder={t('profile.firstName')} disabled={isUpdating}/>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                                    {t('profile.lastName')}
                                                </label>
                                                <span className="text-xs text-gray-500 dark:text-slate-400">
                          {t('profile.currentValue')} <span className="font-medium">{userInfo.lastName || t('profile.notSet')}</span>
                        </span>
                                            </div>
                                            <Input register={profileForm.register('lastName')} error={profileForm.formState.errors.lastName?.message} placeholder={t('profile.lastName')} disabled={isUpdating}/>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                                {t('profile.login')}
                                            </label>
                                            <span className="text-xs text-gray-500 dark:text-slate-400">
                        {t('profile.currentValue')} <span className="font-medium">{userInfo.username}</span>
                      </span>
                                        </div>
                                        <Input register={profileForm.register('username')} error={profileForm.formState.errors.username?.message} placeholder={t('profile.login')} disabled={isUpdating}/>
                                        {profileForm.formState.errors.username && (<p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                {t('profile.loginHint')}
                                            </p>)}
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-600/80">
                                        <h4 className="font-medium text-gray-700 dark:text-slate-300 mb-2">{t('profile.preview')}</h4>
                                        <p className="text-sm text-gray-600 dark:text-slate-400">
                                            {t('profile.previewHint')}
                                        </p>
                                        <div className="mt-2 p-3 bg-white dark:bg-slate-800/90 rounded-lg border border-gray-300 dark:border-slate-600 shadow-sm">
                                            <p className="font-medium text-gray-900 dark:text-slate-100">
                                                {profileForm.watch('firstName') || userInfo.firstName || ''} {profileForm.watch('lastName') || userInfo.lastName || ''}
                                                {(!profileForm.watch('firstName') && !userInfo.firstName && !profileForm.watch('lastName') && !userInfo.lastName) && t('profile.notSet')}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                                @{profileForm.watch('username') || userInfo.username}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
                                        <Button type="button" variant="secondary" onClick={() => {
                profileForm.reset({
                    firstName: userInfo.firstName || '',
                    lastName: userInfo.lastName || '',
                    username: userInfo.username || '',
                });
                setProfileMessage(null);
            }} disabled={!profileForm.formState.isDirty || isUpdating} className="mr-3">
                                            {t('profile.cancel')}
                                        </Button>
                                        <Button type="submit" variant="primary" loading={isUpdating} disabled={!profileForm.formState.isDirty || isUpdating} className="min-w-[120px]">
                                            {isUpdating ? t('profile.saving') : t('profile.save')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>) : (<Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('profile.passwordTitle')}</h3>
                            </CardHeader>
                            <CardContent>
                                {passwordMessage && (<div className={`mb-4 p-3 rounded-lg flex items-center animate-fade-in ${passwordMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/60'
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/35 dark:text-red-300 dark:border-red-800/50'}`}>
                                        {passwordMessage.type === 'success' ? (<CheckCircle className="h-5 w-5 mr-2 flex-shrink-0"/>) : (<AlertCircle className="h-5 w-5 mr-2 flex-shrink-0"/>)}
                                        <span className="text-sm">{passwordMessage.text}</span>
                                    </div>)}

                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                                    <Input label={t('profile.oldPassword')} type="password" register={passwordForm.register('oldPassword')} error={passwordForm.formState.errors.oldPassword?.message} placeholder={t('profile.oldPassword')} disabled={isUpdating}/>

                                    <Input label={t('profile.newPassword')} type="password" register={passwordForm.register('newPassword')} error={passwordForm.formState.errors.newPassword?.message} placeholder={t('profile.newPasswordPh')} disabled={isUpdating}/>

                                    <Input label={t('profile.confirmPassword')} type="password" register={passwordForm.register('confirmPassword')} error={passwordForm.formState.errors.confirmPassword?.message} placeholder={t('profile.confirmPasswordPh')} disabled={isUpdating}/>

                                    <div className="p-4 bg-blue-50 dark:bg-indigo-950/35 rounded-xl border border-blue-200 dark:border-indigo-500/30">
                                        <h4 className="font-medium text-blue-700 dark:text-indigo-300 mb-2">{t('profile.passwordRules')}</h4>
                                        <ul className="text-sm text-blue-600 dark:text-indigo-200/90 space-y-1">
                                            <li className="flex items-center">
                                                <div className={`h-2 w-2 rounded-full mr-2 ${passwordForm.watch('newPassword')?.length >= 6 ? 'bg-green-500' : 'bg-blue-300'}`}/>
                                                {t('profile.passwordRuleLen')}
                                            </li>
                                            <li className="flex items-center">
                                                <div className={`h-2 w-2 rounded-full mr-2 ${passwordForm.watch('newPassword') && passwordForm.watch('confirmPassword') && passwordForm.watch('newPassword') === passwordForm.watch('confirmPassword') ? 'bg-green-500' : 'bg-blue-300'}`}/>
                                                {t('profile.passwordRuleMatch')}
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
                                        <Button type="button" variant="secondary" onClick={() => {
                passwordForm.reset({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setPasswordMessage(null);
            }} disabled={isUpdating} className="mr-3">
                                            {t('profile.clear')}
                                        </Button>
                                        <Button type="submit" variant="primary" loading={isUpdating} disabled={isUpdating} className="min-w-[140px]">
                                            {isUpdating ? t('profile.updatingPassword') : t('profile.changePassword')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>)}
                </div>
            </div>
        </div>);
};
export default Profile;
