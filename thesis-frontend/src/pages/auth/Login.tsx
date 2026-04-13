import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn, Mail, Lock } from 'lucide-react';
import { createLoginSchema } from '../../utils/validation';
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
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { login, isLoading } = useAuth();
    const toast = useToast();
    const loginSchema = useMemo(() => createLoginSchema(t), [t]);
    useEffect(() => {
        if (searchParams.get('activated') === '1') {
            toast.success(t('auth.login.activated'));
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
    }, [searchParams, setSearchParams, t]);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [apiError, setApiError] = useState<string>('');
    const { register, handleSubmit, formState: { errors, isValid }, } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
    });
    const onSubmit = async (data: LoginFormData) => {
        if (!captchaVerified) {
            toast.error(t('auth.login.captcha'));
            return;
        }
        setApiError('');
        try {
            await login(data.emailOrUsername, data.password);
            navigate('/dashboard');
        }
        catch (error: unknown) {
            let errorMessage = t('auth.login.fail');
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
                        {t('auth.login.title')}
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">{t('auth.login.subtitle')}</p>
                </div>

                <div className="glass-panel p-5 sm:p-8 md:p-9 border border-white/60 dark:border-slate-600 rounded-2xl">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                                    {t('auth.login.emailOrUsername')}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-300"/>
                                    <input type="text" autoComplete="username" className={`w-full pl-10 pr-4 py-3 border text-base sm:text-sm ${errors.emailOrUsername ? 'border-red-300' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-300 transition-all duration-200 placeholder:text-slate-400 bg-white/80 dark:bg-slate-900/40 dark:border-slate-600 dark:text-slate-100`} placeholder={t('auth.login.emailPlaceholder')} {...register('emailOrUsername')}/>
                                </div>
                                {errors.emailOrUsername && (<p className="mt-1 text-sm text-red-600 animate-fade-in">
                                        {errors.emailOrUsername.message}
                                    </p>)}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('auth.login.password')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-300"/>
                                    <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" className={`w-full pl-10 pr-12 py-3 border text-base sm:text-sm ${errors.password ? 'border-red-300' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-300 transition-all duration-200 placeholder:text-slate-400 bg-white/80 dark:bg-slate-900/40 dark:border-slate-600 dark:text-slate-100`} placeholder={t('auth.login.passwordPlaceholder')} {...register('password')}/>
                                    <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                {errors.password && (<p className="mt-1 text-sm text-red-600 animate-fade-in">
                                        {errors.password.message}
                                    </p>)}
                            </div>
                        </div>

                        {apiError && (<div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/80 rounded-xl">
                                <p className="text-sm text-rose-700 dark:text-rose-200 text-center">⚠️ {apiError}</p>
                            </div>)}

                        <Captcha onVerify={setCaptchaVerified}/>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <Link to="/forgot-password" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
                                    {t('auth.login.forgot')}
                                </Link>
                            </div>
                        </div>

                        <Button type="submit" variant="primary" size="lg" loading={isLoading} disabled={!isValid || !captchaVerified} fullWidth className="flex items-center justify-center py-3 rounded-xl shadow-lg hover:shadow-xl transition-[box-shadow] duration-300">
                            <LogIn className="mr-2 h-5 w-5"/>
                            {t('auth.login.submit')}
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                {t('auth.login.noAccount')}{' '}
                                <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
                                    {t('auth.login.register')}
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </AuthShell>);
};
export default Login;
