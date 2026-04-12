import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, LogIn, MailCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import AuthShell from '../../components/layout/AuthShell';

const ActivationSuccess: React.FC = () => {
    const navigate = useNavigate();
    return (
        <AuthShell>
            <div className="max-w-md w-full min-w-0 px-1 text-center animate-fade-in">
                <div className="relative mb-6 sm:mb-8">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-44 h-44 bg-gradient-to-tr from-indigo-300/30 to-violet-300/30 rounded-full blur-2xl" />
                    </div>
                    <MailCheck className="h-20 w-20 sm:h-28 sm:w-28 text-indigo-600 mx-auto relative z-10 drop-shadow" />
                </div>

                <div className="mb-6 sm:mb-8">
                    <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14 text-teal-500 mx-auto mb-4" />
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent mb-2">
                        Аккаунт активирован
                    </h1>
                    <h2 className="text-lg font-semibold text-slate-700 mb-3">Добро пожаловать</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Аккаунт успешно активирован. Можно войти и пользоваться облачным хранилищем.
                    </p>
                </div>

                <div className="glass-panel dark:bg-slate-900/75 dark:border-slate-600 p-5 sm:p-6 border border-white/60 space-y-4 rounded-2xl">
                    <Link to="/login" className="block">
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            className="flex items-center justify-center rounded-xl shadow-lg"
                        >
                            <LogIn className="mr-3 h-5 w-5" />
                            Перейти ко входу
                        </Button>
                    </Link>

                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="w-full text-indigo-600 hover:text-violet-700 font-semibold py-2 transition-colors"
                    >
                        На главную
                    </button>
                </div>
            </div>
        </AuthShell>
    );
};

export default ActivationSuccess;
