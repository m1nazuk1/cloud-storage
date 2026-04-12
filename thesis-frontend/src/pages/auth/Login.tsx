import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import { loginSchema } from '../../utils/validation';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';
import Captcha from '../../components/ui/Captcha';
import AuthShell from '../../components/layout/AuthShell';
type LoginFormData = {
    emailOrUsername: string;
    password: string;
};
const Login: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { login, isLoading } = useAuth();
    const toast = useToast();
    useEffect(() => {
        if (searchParams.get('activated') === '1') {
            toast.success('Аккаунт активирован. Войдите, используя email и пароль.');
            const next = new URLSearchParams(searchParams);
            next.delete('activated');
            setSearchParams(next, { replace: true });
        }
        const actErr = searchParams.get('activationError');
        if (actErr) {
            toast.error(decodeURIComponent(actErr));
            const next = new URLSearchParams(searchParams);
            next.delete('activationError');
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, setSearchParams]);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [apiError, setApiError] = useState<string>('');
    const { register, handleSubmit, formState: { errors, isValid }, } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
    });
    const onSubmit = async (data: LoginFormData) => {
        if (!captchaVerified) {
            toast.error('Пройдите проверку');
            return;
        }
        setApiError('');
        try {
            await login(data.emailOrUsername, data.password);
            navigate('/dashboard');
        }
        catch (error: unknown) {
            let errorMessage = 'Не удалось войти';
            if (error && typeof error === 'object' && 'response' in error) {
                const r = error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                };
                if (r.response?.data?.message) {
                    errorMessage = r.response.data.message;
                }
            }
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
            setApiError(errorMessage);
            toast.error(errorMessage);
        }
    };
    return (<AuthShell>
            <div className="max-w-md w-full min-w-0 space-y-6 sm:space-y-8">
                <div className="text-center px-1">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-600 bg-clip-text text-transparent">
                        С возвращением
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">Войдите в облачное хранилище</p>
                </div>

                <div className="glass-panel dark:bg-slate-900/75 dark:border-slate-600 p-5 sm:p-8 md:p-9 border border-white/60 rounded-2xl">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email или имя пользователя
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-300"/>
                                    <input type="text" autoComplete="username" className={`w-full pl-10 pr-4 py-3 border text-base sm:text-sm ${errors.emailOrUsername ? 'border-red-300' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-300 transition-all duration-200 placeholder:text-slate-400 bg-white/80 dark:bg-slate-900/40 dark:border-slate-600 dark:text-slate-100`} placeholder="Email или логин" {...register('emailOrUsername')}/>
                                </div>
                                {errors.emailOrUsername && (<p className="mt-1 text-sm text-red-600 animate-fade-in">
                                        {errors.emailOrUsername.message}
                                    </p>)}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-300"/>
                                    <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" className={`w-full pl-10 pr-12 py-3 border text-base sm:text-sm ${errors.password ? 'border-red-300' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-300 transition-all duration-200 placeholder:text-slate-400 bg-white/80 dark:bg-slate-900/40 dark:border-slate-600 dark:text-slate-100`} placeholder="Пароль" {...register('password')}/>
                                    <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                {errors.password && (<p className="mt-1 text-sm text-red-600 animate-fade-in">
                                        {errors.password.message}
                                    </p>)}
                            </div>
                        </div>

                        {apiError && (<div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl">
                                <p className="text-sm text-rose-700 text-center">⚠️ {apiError}</p>
                            </div>)}

                        <Captcha onVerify={setCaptchaVerified}/>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-violet-600 transition-colors">
                                    Забыли пароль?
                                </Link>
                            </div>
                        </div>

                        <Button type="submit" variant="primary" size="lg" loading={isLoading} disabled={!isValid || !captchaVerified} fullWidth className="flex items-center justify-center py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <LogIn className="mr-2 h-5 w-5"/>
                            Войти
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-slate-600">
                                Нет аккаунта?{' '}
                                <Link to="/register" className="font-semibold text-indigo-600 hover:text-violet-600 transition-colors">
                                    Регистрация
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </AuthShell>);
};
export default Login;
