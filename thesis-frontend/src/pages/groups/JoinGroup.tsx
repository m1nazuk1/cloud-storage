import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import { groupApi } from '../../api/group';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import AuthShell from '../../components/layout/AuthShell';
const JoinGroup: React.FC = () => {
    const { token } = useParams<{
        token: string;
    }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'ok' | 'err'>(() => (token ? 'loading' : 'err'));
    const [message, setMessage] = useState(() => (token ? '' : 'Некорректная ссылка'));
    useEffect(() => {
        if (!token) {
            setStatus('err');
            setMessage('Некорректная ссылка');
            return;
        }
        let cancelled = false;
        (async () => {
            setStatus('loading');
            try {
                await groupApi.joinGroup(token);
                if (!cancelled) {
                    setStatus('ok');
                    setMessage('Вы присоединились к группе');
                    setTimeout(() => navigate('/groups', { replace: true }), 1500);
                }
            }
            catch (e: unknown) {
                if (!cancelled) {
                    setStatus('err');
                    const msg = (e as {
                        response?: {
                            data?: {
                                message?: string;
                            };
                        };
                    })?.response?.data?.message ||
                        (e as {
                            response?: {
                                data?: string;
                            };
                        })?.response?.data ||
                        'Не удалось вступить в группу';
                    setMessage(typeof msg === 'string' ? msg : 'Ошибка');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token, navigate]);
    return (<AuthShell showLogo={false}>
            <div className="max-w-md w-full">
                <Card className="border-white/60 bg-white/90 backdrop-blur-xl shadow-2xl shadow-indigo-950/15">
                    <CardContent className="py-12 text-center px-6">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white mb-6 shadow-lg">
                            <Users className="h-7 w-7"/>
                        </div>
                        {status === 'loading' && (<>
                                <Loader2 className="h-10 w-10 text-indigo-500 mx-auto mb-4 animate-spin"/>
                                <p className="text-slate-700 font-medium">Подключение к группе…</p>
                            </>)}
                        {status === 'ok' && (<>
                                <p className="text-teal-700 font-semibold text-lg mb-2">{message}</p>
                                <p className="text-sm text-slate-500">Переход к списку групп…</p>
                            </>)}
                        {status === 'err' && (<>
                                <p className="text-rose-600 mb-6 leading-relaxed">{message}</p>
                                <Button variant="primary" onClick={() => navigate('/groups')} className="rounded-xl">
                                    К группам
                                </Button>
                            </>)}
                    </CardContent>
                </Card>
            </div>
        </AuthShell>);
};
export default JoinGroup;
