import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { authApi } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../contexts/ToastContext';
import AuthShell from '../../components/layout/AuthShell';
const resetPasswordSchema = z
    .object({
    password: z.string().min(6, 'Пароль не короче 6 символов'),
    confirmPassword: z.string().min(6, 'Подтвердите пароль'),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
});
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const [token, setToken] = useState<string | null>(null);
    const [tokenValid, setTokenValid] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState(true);
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });
    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (!tokenFromUrl) {
            const errorMsg = searchParams.get('error');
            if (errorMsg) {
                error(decodeURIComponent(errorMsg));
            }
            else {
                error('Неверная или отсутствующая ссылка');
            }
            setTokenValid(false);
        }
        else {
            setToken(tokenFromUrl);
        }
        setIsLoading(false);
    }, [searchParams, error]);
    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            error('Недействительная ссылка');
            return;
        }
        try {
            await authApi.resetPassword(token, data.password);
            success('Пароль успешно изменён');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
        catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'response' in err
                ? (err as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response?.data?.message
                : undefined;
            error(msg || 'Не удалось сбросить пароль');
        }
    };
    if (isLoading) {
        return (<AuthShell showLogo={false}>
                <div className="max-w-md w-full min-w-0 text-center glass-panel dark:bg-slate-900/75 p-6 sm:p-10 border border-white/60 rounded-2xl mx-1">
                    <div className="loading-spinner mx-auto" style={{ width: '40px', height: '40px' }}/>
                    <p className="mt-4 text-slate-600">Проверка ссылки…</p>
                </div>
            </AuthShell>);
    }
    if (!tokenValid) {
        return (<AuthShell>
                <div className="max-w-md w-full min-w-0 text-center glass-panel dark:bg-slate-900/75 p-6 sm:p-10 border border-white/60 rounded-2xl mx-1">
                    <AlertCircle className="h-14 w-14 text-rose-500 mx-auto mb-4"/>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Ссылка недействительна</h2>
                    <p className="text-slate-600 mb-6">Ссылка для сброса пароля устарела или неверна.</p>
                    <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-violet-600">
                        Запросить новую ссылку
                    </Link>
                </div>
            </AuthShell>);
    }
    return (<AuthShell>
            <div className="max-w-md w-full min-w-0 space-y-6 sm:space-y-8 px-1">
                <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-600 bg-clip-text text-transparent">
                        Новый пароль
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Введите новый пароль ниже.</p>
                </div>

                <div className="glass-panel dark:bg-slate-900/75 dark:border-slate-600 p-5 sm:p-8 border border-white/60 rounded-2xl">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <Input label="Новый пароль" type="password" autoComplete="new-password" error={errors.password?.message} placeholder="Новый пароль" register={register('password')} icon={<Key className="h-5 w-5 text-indigo-300"/>}/>

                            <Input label="Подтверждение" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} placeholder="Повторите пароль" register={register('confirmPassword')} icon={<CheckCircle className="h-5 w-5 text-indigo-300"/>}/>
                        </div>

                        <Button type="submit" variant="primary" size="lg" loading={isSubmitting} fullWidth className="flex items-center justify-center rounded-xl">
                            Сохранить пароль
                        </Button>

                        <div className="text-center">
                            <Link to="/login" className="text-sm font-semibold text-indigo-600 hover:text-violet-600">
                                Назад ко входу
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AuthShell>);
};
export default ResetPassword;
