import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, UserPlus, Mail, User, Lock, CheckCircle } from 'lucide-react';
import { registerSchema } from '../../utils/validation';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Captcha from '../../components/ui/Captcha';
import toast from 'react-hot-toast';

type RegisterFormData = {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
};

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register: registerUser, isLoading } = useAuth();
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isValid }
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
    });

    const onSubmit = async (data: RegisterFormData) => {
        if (!captchaVerified) {
            toast.error('Please complete the security verification');
            return;
        }

        try {
            await registerUser(data);
            setRegisteredEmail(data.email);
            setSubmitted(true);

            // Показываем уведомление
            toast.success(
                <div className="space-y-2">
                    <div className="font-semibold">🎉 Registration Successful!</div>
                    <div className="text-sm">Please check your email to activate your account.</div>
                </div>,
                { duration: 8000 }
            );

            // Автоматический редирект через 5 секунд
            setTimeout(() => {
                navigate('/login');
            }, 5000);
        } catch (error) {
            // Error is handled by interceptor
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-6">
                            <CheckCircle className="h-20 w-20 text-green-500 animate-bounce-slow" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Check Your Email!
                        </h2>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                                    <Mail className="h-8 w-8 text-primary-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Activation Email Sent
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    We've sent an activation link to:
                                </p>
                                <p className="font-medium text-primary-700 bg-primary-50 py-2 px-4 rounded-lg">
                                    {registeredEmail}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center">
                                            <span className="text-accent-600 text-sm font-bold">1</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Check your inbox</p>
                                        <p className="text-sm text-gray-600">Look for an email from CloudSync</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center">
                                            <span className="text-accent-600 text-sm font-bold">2</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Click activation link</p>
                                        <p className="text-sm text-gray-600">Verify your email address</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center">
                                            <span className="text-accent-600 text-sm font-bold">3</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Start using CloudSync</p>
                                        <p className="text-sm text-gray-600">Login with your new account</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <p className="text-sm text-gray-500 text-center">
                                    Didn't receive the email? Check your spam folder or{' '}
                                    <button className="text-primary-600 hover:text-primary-700 font-medium">
                                        resend activation email
                                    </button>
                                </p>
                            </div>

                            <Button
                                variant="primary"
                                fullWidth
                                onClick={() => navigate('/login')}
                                className="py-3 rounded-xl"
                            >
                                Continue to Login
                            </Button>

                            <p className="text-xs text-gray-400 text-center">
                                Redirecting to login in 5 seconds...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <Cloud className="h-16 w-16 text-primary-600 animate-pulse-slow" />
                            <div className="absolute inset-0 bg-primary-200 rounded-full blur-xl opacity-30"></div>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        Create Account
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Join CloudSync for secure file sharing
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        autoComplete="given-name"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white/50"
                                        placeholder="Optional"
                                        {...register('firstName')}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        autoComplete="family-name"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white/50"
                                        placeholder="Optional"
                                        {...register('lastName')}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    autoComplete="email"
                                    className={`w-full pl-10 pr-4 py-3 border ${
                                        errors.email ? 'border-red-300' : 'border-gray-300'
                                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white/50`}
                                    placeholder="Enter email"
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    autoComplete="username"
                                    className={`w-full pl-10 pr-4 py-3 border ${
                                        errors.username ? 'border-red-300' : 'border-gray-300'
                                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white/50`}
                                    placeholder="Enter username"
                                    {...register('username')}
                                />
                            </div>
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password *
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    className={`w-full pl-10 pr-12 py-3 border ${
                                        errors.password ? 'border-red-300' : 'border-gray-300'
                                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white/50`}
                                    placeholder="Enter password"
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                                    {errors.password.message}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Password must be at least 6 characters long
                            </p>
                        </div>

                        {/* Капча */}
                        <Captcha onVerify={setCaptchaVerified} />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={isLoading}
                            disabled={!isValid || !captchaVerified}
                            fullWidth
                            className="flex items-center justify-center py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            <UserPlus className="mr-2 h-5 w-5" />
                            Create Account
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;