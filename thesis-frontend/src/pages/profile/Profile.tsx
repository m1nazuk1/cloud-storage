import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Calendar, Shield, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userUpdateSchema, passwordChangeSchema } from '../../utils/validation';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {z} from "zod";

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
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [passwordMessage, setPasswordMessage] = useState('');

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(userUpdateSchema),
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            username: user?.username || '',
        },
    });

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordChangeSchema.extend({
            confirmPassword: z.string().min(6, 'Confirm password is required'),
        }).refine((data) => data.newPassword === data.confirmPassword, {
            message: "Passwords don't match",
            path: ["confirmPassword"],
        })),
    });

    const onProfileSubmit = async (data: ProfileFormData) => {
        try {
            await updateUser(data);
            profileForm.reset(data);
        } catch (error) {
            // Error is handled by interceptor
        }
    };

    const onPasswordSubmit = async () => {
        try {
            // Here you would call the password change API
            setPasswordMessage('Password updated successfully!');
            passwordForm.reset();
        } catch (error) {
            setPasswordMessage('Failed to update password');
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

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
                                    <h3 className="font-semibold text-gray-900">{user.username}</h3>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                            </div>

                            <nav className="space-y-1">
                                <button
                                    onClick={() => setActiveTab('profile')}
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
                                    onClick={() => setActiveTab('security')}
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
                            <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                    <span className="text-gray-900">{user.email}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                    <span className="text-gray-900">
                    Joined {new Date(user.registrationDate).toLocaleDateString()}
                  </span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Shield className="h-4 w-4 text-gray-400 mr-2" />
                                    <span className="text-gray-900">
                    {user.roles.join(', ')}
                  </span>
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
                                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            label="First Name"
                                            {...profileForm.register('firstName')}
                                            error={profileForm.formState.errors.firstName?.message}
                                        />
                                        <Input
                                            label="Last Name"
                                            {...profileForm.register('lastName')}
                                            error={profileForm.formState.errors.lastName?.message}
                                        />
                                    </div>

                                    <Input
                                        label="Username"
                                        {...profileForm.register('username')}
                                        error={profileForm.formState.errors.username?.message}
                                    />

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            loading={profileForm.formState.isSubmitting}
                                            disabled={!profileForm.formState.isDirty}
                                        >
                                            Save Changes
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
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                                    <Input
                                        label="Current Password"
                                        type="password"
                                        {...passwordForm.register('oldPassword')}
                                        error={passwordForm.formState.errors.oldPassword?.message}
                                    />

                                    <Input
                                        label="New Password"
                                        type="password"
                                        {...passwordForm.register('newPassword')}
                                        error={passwordForm.formState.errors.newPassword?.message}
                                    />

                                    <Input
                                        label="Confirm New Password"
                                        type="password"
                                        {...passwordForm.register('confirmPassword')}
                                        error={passwordForm.formState.errors.confirmPassword?.message}
                                    />

                                    {passwordMessage && (
                                        <div className={`p-3 rounded-md ${passwordMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {passwordMessage}
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            loading={passwordForm.formState.isSubmitting}
                                        >
                                            Update Password
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