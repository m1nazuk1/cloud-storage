import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { XCircle, Loader } from 'lucide-react';
import { authApi } from '../../api/auth';
import Button from '../../components/ui/Button';
import AuthShell from '../../components/layout/AuthShell';
const Activate: React.FC = () => {
    const { t } = useTranslation();
    const { code } = useParams<{
        code: string;
    }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    useEffect(() => {
        const activateAccount = async () => {
            if (!code) {
                setStatus('error');
                setMessage(t('auth.activate.badCode'));
                return;
            }
            try {
                await authApi.activate(code);
                navigate(`/activation-success`);
            }
            catch (error: unknown) {
                setStatus('error');
                const msg = error && typeof error === 'object' && 'response' in error
                    ? (error as {
                        response?: {
                            data?: {
                                message?: string;
                            };
                        };
                    }).response?.data?.message
                    : undefined;
                setMessage(msg || t('auth.activate.defaultError'));
            }
        };
        activateAccount();
    }, [code, navigate, t]);
    if (status === 'loading') {
        return (<AuthShell showLogo={false}>
                <div className="max-w-md w-full min-w-0 mx-1 text-center glass-panel p-6 sm:p-10 border border-white/60 dark:border-slate-600 rounded-2xl">
                    <Loader className="h-16 w-16 text-indigo-500 dark:text-indigo-400 mx-auto mb-4 animate-spin"/>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">{t('auth.activate.loadingTitle')}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{t('auth.activate.loadingHint')}</p>
                </div>
            </AuthShell>);
    }
    if (status === 'error') {
        return (<AuthShell>
                <div className="max-w-md w-full min-w-0 mx-1 text-center glass-panel p-6 sm:p-10 border border-white/60 dark:border-slate-600 rounded-2xl">
                    <XCircle className="h-16 w-16 text-rose-500 mx-auto mb-4"/>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">{t('auth.activate.errorTitle')}</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">{message}</p>
                    <div className="space-y-3">
                        <Button variant="primary" onClick={() => navigate('/login')} className="w-full rounded-xl">
                            {t('auth.activate.toLogin')}
                        </Button>
                        <Button variant="secondary" onClick={() => navigate('/register')} className="w-full rounded-xl">
                            {t('auth.activate.registerAgain')}
                        </Button>
                    </div>
                </div>
            </AuthShell>);
    }
    return null;
};
export default Activate;
