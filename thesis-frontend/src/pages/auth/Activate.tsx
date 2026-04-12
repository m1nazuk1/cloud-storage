import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { XCircle, Loader } from 'lucide-react';
import { authApi } from '../../api/auth';
import Button from '../../components/ui/Button';
import AuthShell from '../../components/layout/AuthShell';
const Activate: React.FC = () => {
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
                setMessage('Неверный код активации');
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
                setMessage(msg || 'Не удалось активировать аккаунт. Ссылка могла устареть.');
            }
        };
        activateAccount();
    }, [code, navigate]);
    if (status === 'loading') {
        return (<AuthShell showLogo={false}>
                <div className="max-w-md w-full min-w-0 mx-1 text-center glass-panel dark:bg-slate-900/75 p-6 sm:p-10 border border-white/60 rounded-2xl">
                    <Loader className="h-16 w-16 text-indigo-500 mx-auto mb-4 animate-spin"/>
                    <h2 className="text-xl font-semibold text-slate-800 mb-2">Активация аккаунта…</h2>
                    <p className="text-slate-500">Подождите, проверяем ссылку.</p>
                </div>
            </AuthShell>);
    }
    if (status === 'error') {
        return (<AuthShell>
                <div className="max-w-md w-full min-w-0 mx-1 text-center glass-panel dark:bg-slate-900/75 p-6 sm:p-10 border border-white/60 rounded-2xl">
                    <XCircle className="h-16 w-16 text-rose-500 mx-auto mb-4"/>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Ошибка активации</h2>
                    <p className="text-slate-600 mb-6">{message}</p>
                    <div className="space-y-3">
                        <Button variant="primary" onClick={() => navigate('/login')} className="w-full rounded-xl">
                            Ко входу
                        </Button>
                        <Button variant="secondary" onClick={() => navigate('/register')} className="w-full rounded-xl">
                            Регистрация снова
                        </Button>
                    </div>
                </div>
            </AuthShell>);
    }
    return null;
};
export default Activate;
