import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationDropdown from '../features/notifications/NotificationDropdown';
import ThemeToggle from '../features/theme/ThemeToggle';
import UserAvatar from '../chat/UserAvatar';
interface HeaderProps {
    onMenuClick?: () => void;
}
const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const searchInput = (<div className="relative w-full min-w-0">
            <label htmlFor="search" className="sr-only">
                Поиск по группам на странице «Группы»
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-indigo-300 dark:text-indigo-500 shrink-0"/>
            </div>
            <input id="search" className="block w-full min-w-0 pl-10 pr-3 py-2.5 sm:py-2.5 border border-slate-200/90 dark:border-slate-600/80 rounded-xl leading-5 bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-inner shadow-slate-900/5 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300 text-base sm:text-sm transition-all duration-200 touch-manipulation" placeholder="Группы…" type="search" enterKeyHint="search" autoComplete="off" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => {
            if (e.key === 'Enter' && search.trim()) {
                navigate(`/groups?q=${encodeURIComponent(search.trim())}`);
            }
        }}/>
        </div>);
    return (<header className="sticky top-0 z-30 w-full border-b border-white/50 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm shadow-indigo-950/5 dark:shadow-black/25 transition-colors duration-300 pt-safe">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
                
                <div className="flex flex-col gap-2 py-2 sm:py-0 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex items-center justify-between gap-2 min-h-[2.75rem] sm:min-h-0 sm:flex-1 sm:min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                            <button type="button" className="lg:hidden shrink-0 p-2 -ml-1 text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-xl transition-colors touch-manipulation" onClick={onMenuClick} aria-label="Открыть меню">
                                <Menu className="h-6 w-6"/>
                            </button>
                            <div className="hidden sm:flex flex-1 min-w-0 lg:max-w-md">
                                {searchInput}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            <ThemeToggle />
                            <NotificationDropdown />
                            {user && (<button type="button" onClick={() => navigate('/profile')} className="shrink-0 rounded-full overflow-hidden ring-2 ring-slate-300/95 dark:ring-slate-500/80 shadow-md shadow-slate-900/8 dark:shadow-black/35 transition-transform hover:scale-[1.04] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/90 dark:focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900" aria-label="Профиль" title="Профиль">
                                    <UserAvatar user={user} className="h-9 w-9 ring-0"/>
                                </button>)}
                            <div className="hidden lg:flex items-center gap-3 pl-2 border-l border-slate-200/80 dark:border-slate-600/80 min-w-0">
                                <div className="text-sm min-w-0">
                                    <div className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
                                        {user?.username}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400 truncate max-w-[200px] text-xs">{user?.email}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="sm:hidden w-full min-w-0 pb-1">{searchInput}</div>
                </div>
            </div>
        </header>);
};
export default Header;
