import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Cloud, Key, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { authApi } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../contexts/ToastContext';

const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const [token, setToken] = useState<string | null>(null);
    const [tokenValid, setTokenValid] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');

        if (!tokenFromUrl) {
            const errorMsg = searchParams.get('error');
            if (errorMsg) {
                error(decodeURIComponent(errorMsg));
            } else {
                error('Invalid or missing reset token');
            }
            setTokenValid(false);
        } else {
            setToken(tokenFromUrl);
            // Здесь можно добавить проверку токена на бекенде
        }
        setIsLoading(false);
    }, [searchParams, error]);

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            error('Invalid reset token');
            return;
        }

        try {
            // Используем query параметры для отправки данных
            await authApi.resetPassword(token, data.password);
            success('Your password has been reset successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to reset password');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="loading-spinner mx-auto" style={{ width: '40px', height: '40px' }}></div>
                    <p className="mt-4 text-gray-600">Checking reset token...</p>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full text-center">
                    <Cloud className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Invalid Reset Link</h2>
                    <p className="text-gray-600 mb-6">
                        This password reset link is invalid or has expired.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Request a new reset link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="flex justify-center">
                        <Cloud className="h-12 w-12 text-primary-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Set new password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Please enter your new password below.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <Input
                            label="New Password"
                            type="password"
                            autoComplete="new-password"
                            error={errors.password?.message}
                            placeholder="Enter new password"
                            register={register('password')} // Теперь передаем register правильно
                            icon={<Key className="h-5 w-5 text-gray-400" />}
                        />

                        <Input
                            label="Confirm New Password"
                            type="password"
                            autoComplete="new-password"
                            error={errors.confirmPassword?.message}
                            placeholder="Confirm new password"
                            register={register('confirmPassword')} // Теперь передаем register правильно
                            icon={<CheckCircle className="h-5 w-5 text-gray-400" />}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={isSubmitting}
                        fullWidth
                        className="flex items-center justify-center"
                    >
                        Reset Password
                    </Button>

                    <div className="text-center">
                        <Link
                            to="/login"
                            className="text-sm font-medium text-primary-600 hover:text-primary-500"
                        >
                            Back to login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;