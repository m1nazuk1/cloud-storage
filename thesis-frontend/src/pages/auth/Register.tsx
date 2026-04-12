import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, User, Lock, CheckCircle } from 'lucide-react';
import { registerSchema } from '../../utils/validation';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Captcha from '../../components/ui/Captcha';
import AuthShell from '../../components/layout/AuthShell';
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
    const { register, handleSubmit, formState: { errors, isValid } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
    });
    const onSubmit = async (data: RegisterFormData) => {
        if (!captchaVerified) {
            toast.error('Пройдите проверку');
            return;
        }
        try {
            await registerUser(data);
            setRegisteredEmail(data.email);
            setSubmitted(true);
            toast.success(<div className="space-y-2">
                    <div className="font-semibold">🎉 Регистрация прошла успешно</div>
                    <div className="text-sm">Проверьте почту для активации аккаунта.</div>
                </div>, { duration: 8000 });
        }
        catch (error) {
            void error;
        }
    };
    if (submitted) {
        return (<AuthShell>
                <div className="max-w-md w-full min-w-0 px-1">
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="flex justify-center mb-4 sm:mb-6">
                            <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-green-500 animate-bounce-slow"/>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                            Проверьте почту
                        </h2>
                    </div>

                    <div className="glass-panel dark:bg-slate-900/75 dark:border-slate-600 p-5 sm:p-8 border border-white/60 rounded-2xl">
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                                    <Mail className="h-8 w-8 text-primary-600"/>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Письмо отправлено
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Ссылка для активации отправлена на:
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
                                        <p className="font-medium text-gray-900">Откройте почту</p>
                                        <p className="text-sm text-gray-600">Найдите письмо от сервиса</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center">
                                            <span className="text-accent-600 text-sm font-bold">2</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Перейдите по ссылке</p>
                                        <p className="text-sm text-gray-600">Подтвердите адрес email</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center">
                                            <span className="text-accent-600 text-sm font-bold">3</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Войдите в систему</p>
                                        <p className="text-sm text-gray-600">Используйте новый аккаунт</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <p className="text-sm text-gray-500 text-center">
                                    Не пришло письмо? Проверьте спам или{' '}
                                    <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">
                                        запросите повторно
                                    </button>
                                </p>
                            </div>

                            <Button variant="primary" fullWidth onClick={() => navigate('/login')} className="py-3 rounded-xl">
                                Перейти ко входу
                            </Button>

                        </div>
                    </div>
                </div>
            </AuthShell>);
    }
    return (<AuthShell>
            <div className="max-w-md w-full min-w-0 space-y-6 sm:space-y-8 px-1">
                <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-600 bg-clip-text text-transparent">
                        Регистрация
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        Создайте аккаунт для доступа к файлам
                    </p>
                </div>

                <div className="glass-panel dark:bg-slate-900/75 dark:border-slate-600 p-5 sm:p-8 border border-white/60 rounded-2xl">
                    <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Имя
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                    <input type="text" autoComplete="given-name" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white/50 dark:bg-slate-900/40 dark:border-slate-600 dark:text-slate-100" placeholder="Необязательно" {...register('firstName')}/>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Фамилия
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                    <input type="text" autoComplete="family-name" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white/50 dark:bg-slate-900/40 dark:border-slate-600 dark:text-slate-100" placeholder="Необязательно" {...register('lastName')}/>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input type="email" autoComplete="email" className={`w-full pl-10 pr-4 py-3 border text-base sm:text-sm ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white/50 dark:bg-slate-900/40 dark:border-slate-600 dark:text-slate-100`} placeholder="Ваш email" {...register('email')}/>
                            </div>
                            {errors.email && (<p className="mt-1 text-sm text-red-600 animate-fade-in">
                                    {errors.email.message}
                                </p>)}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Логин *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input type="text" autoComplete="username" className={`w-full pl-10 pr-4 py-3 border text-base sm:text-sm ${errors.username ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white/50 dark:bg-slate-900/40 dark:border-slate-600 dark:text-slate-100`} placeholder="Имя пользователя" {...register('username')}/>
                            </div>
                            {errors.username && (<p className="mt-1 text-sm text-red-600 animate-fade-in">
                                    {errors.username.message}
                                </p>)}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Пароль *
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input type={showPassword ? "text" : "password"} autoComplete="new-password" className={`w-full pl-10 pr-12 py-3 border text-base sm:text-sm ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 bg-white/50 dark:bg-slate-900/40 dark:border-slate-600 dark:text-slate-100`} placeholder="Не менее 6 символов" {...register('password')}/>
                                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {errors.password && (<p className="mt-1 text-sm text-red-600 animate-fade-in">
                                    {errors.password.message}
                                </p>)}
                            <p className="mt-1 text-xs text-gray-500">
                                Минимум 6 символов
                            </p>
                        </div>

                        
                        <Captcha onVerify={setCaptchaVerified}/>

                        <Button type="submit" variant="primary" size="lg" loading={isLoading} disabled={!isValid || !captchaVerified} fullWidth className="flex items-center justify-center py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                            <UserPlus className="mr-2 h-5 w-5"/>
                            Зарегистрироваться
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Уже есть аккаунт?{' '}
                                <Link to="/login" className="font-semibold text-indigo-600 hover:text-violet-600 transition-colors">
                                    Войти
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </AuthShell>);
};
export default Register;
