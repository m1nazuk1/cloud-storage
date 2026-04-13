import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../contexts/ToastContext';
import AuthShell from '../../components/layout/AuthShell';
import { createForgotPasswordSchema } from '../../utils/validation';
type ForgotPasswordFormData = {
    email: string;
};
const ForgotPassword: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const forgotPasswordSchema = useMemo(() => createForgotPasswordSchema(t), [t]);
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });
    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            await authApi.requestPasswordReset(data.email);
            success(t('auth.forgot.sentSuccess'));
            navigate('/login');
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
            error(msg || t('auth.forgot.sendFail'));
        }
    };
    return (<AuthShell>
            <div className="max-w-md w-full min-w-0 space-y-6 sm:space-y-8 px-1">
                <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-600 bg-clip-text text-transparent">
                        {t('auth.forgot.title')}
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">{t('auth.forgot.subtitle')}</p>
                </div>

                <div className="glass-panel p-5 sm:p-8 border border-white/60 dark:border-slate-600 rounded-2xl">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} placeholder="you@example.com" register={register('email')} icon={<Mail className="h-5 w-5 text-indigo-300"/>}/>
                        </div>

                        <Button type="submit" variant="primary" size="lg" loading={isSubmitting} fullWidth className="flex items-center justify-center rounded-xl">
                            {t('auth.forgot.submit')}
                        </Button>

                        <div className="text-center">
                            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-violet-600 dark:text-indigo-400 dark:hover:text-violet-300">
                                <ArrowLeft className="h-4 w-4"/>
                                {t('auth.forgot.backLogin')}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AuthShell>);
};
export default ForgotPassword;
