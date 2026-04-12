import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import Button from '../components/ui/Button';
import AuthShell from '../components/layout/AuthShell';

const NotFound: React.FC = () => {
    return (
        <AuthShell>
            <div className="max-w-lg w-full min-w-0 text-center px-1">
                <div className="inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/30 mb-5 sm:mb-6">
                    <Compass className="h-9 w-9 sm:h-10 sm:w-10" />
                </div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-indigo-600/90 mb-2">Ошибка</p>
                <h1 className="text-5xl sm:text-7xl font-black bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    404
                </h1>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">Страница не найдена</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">Такой страницы нет или адрес изменился.</p>
                <div className="glass-panel dark:bg-slate-900/80 dark:border-slate-600 p-4 sm:p-6 border border-white/60 space-y-3 rounded-2xl">
                    <Link to="/dashboard">
                        <Button variant="primary" fullWidth className="flex items-center justify-center rounded-xl">
                            <Home className="mr-2 h-5 w-5" />
                            На главную
                        </Button>
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="w-full text-sm font-semibold text-indigo-600 hover:text-violet-700 py-2"
                    >
                        Назад
                    </button>
                </div>
            </div>
        </AuthShell>
    );
};

export default NotFound;
