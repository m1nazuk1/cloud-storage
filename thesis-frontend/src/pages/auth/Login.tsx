import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, LogIn, Mail, Lock } from 'lucide-react';
import { loginSchema } from '../../utils/validation';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Captcha from '../../components/ui/Captcha';

type LoginFormData = {
    emailOrUsername: string;
    password: string;
};

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login, isLoading } = useAuth();
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid }
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
    });

    const onSubmit = async (data: LoginFormData) => {
        if (!captchaVerified) {
            alert('Please complete the security verification');
            return;
        }

        try {
            await login(data.emailOrUsername, data.password);
            navigate('/dashboard');
        } catch (error) {
            // Error is handled by interceptor
        }
    };

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
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Sign in to your CloudSync account
                    </p>
                </div>



                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email or Username
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        autoComplete="username"
                                        className={`w-full pl-10 pr-4 py-3 border ${
                                            errors.emailOrUsername ? 'border-red-300' : 'border-gray-300'
                                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white/50`}
                                        placeholder="Enter email or username"
                                        {...register('emailOrUsername')}
                                    />
                                </div>
                                {errors.emailOrUsername && (
                                    <p className="mt-1 text-sm text-red-600 animate-fade-in">
                                        {errors.emailOrUsername.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
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
                            </div>
                        </div>

                        {/* Капча */}
                        <Captcha onVerify={setCaptchaVerified} />

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={isLoading}
                            disabled={!isValid || !captchaVerified}
                            fullWidth
                            className="flex items-center justify-center py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            <LogIn className="mr-2 h-5 w-5" />
                            Sign in
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;