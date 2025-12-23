import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, Mail, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { authApi } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../contexts/ToastContext';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const { success, error } = useToast();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            // Вызываем API для запроса сброса пароля
            await authApi.requestPasswordReset(data.email);
            success('Password reset instructions have been sent to your email');
            navigate('/login');
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to send reset instructions');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="flex justify-center">
                        <Cloud className="h-12 w-12 text-primary-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Reset your password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your email address and we'll send you instructions to reset your password.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <Input
                            label="Email address"
                            type="email"
                            autoComplete="email"
                            error={errors.email?.message}
                            placeholder="you@example.com"
                            register={register('email')}
                            icon={<Mail className="h-5 w-5 text-gray-400" />}
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
                        Send reset instructions
                    </Button>

                    <div className="text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;