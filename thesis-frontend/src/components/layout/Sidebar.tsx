import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Folder, Bell, User, LogOut, ChevronLeft, ChevronRight, } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BrandCloudButton from './BrandCloudButton';
interface SidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
}
const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onMobileClose, collapsed: collapsedProp, onCollapsedChange, }) => {
    const { t } = useTranslation();
    const [collapsedLocal, setCollapsedLocal] = useState(false);
    const collapsed = collapsedProp !== undefined ? collapsedProp : collapsedLocal;
    const setCollapsed = (next: boolean) => {
        onCollapsedChange?.(next);
        if (!onCollapsedChange)
            setCollapsedLocal(next);
    };
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    const closeMobile = () => onMobileClose?.();
    const navItems = useMemo(() => [
        { to: '/dashboard', icon: Home, label: t('nav.home') },
        { to: '/groups', icon: Folder, label: t('nav.groups') },
        { to: '/notifications', icon: Bell, label: t('nav.notifications') },
        { to: '/profile', icon: User, label: t('nav.profile') },
    ], [t]);
    const linkClass = ({ isActive }: {
        isActive: boolean;
    }) => `group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors duration-200 active:brightness-95 ${isActive
        ? 'bg-gradient-to-r from-indigo-500/35 to-violet-500/25 text-white shadow-lg shadow-indigo-950/40 border border-white/10'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'}`;
    return (<>
            {mobileOpen && (<div className="lg:hidden fixed inset-0 z-50 flex">
                    <button type="button" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm cursor-default" aria-label={t('nav.closeMenu')} onClick={closeMobile}/>
                    <div className="relative flex flex-col max-w-[min(100vw-2rem,20rem)] w-full max-h-[100dvh] bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 shadow-2xl shadow-indigo-950/50 border-r border-white/10">
                        <div className="flex-1 h-0 pt-6 pb-4 overflow-y-auto">
                            <div className="flex items-center flex-shrink-0 px-4">
                                <BrandCloudButton className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 border-0 p-0 cursor-pointer hover:brightness-110 active:brightness-95 transition-[filter] duration-200"/>
                                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                                    {t('brand.cloud')}
                                </span>
                            </div>
                            <nav className="mt-8 px-3 space-y-1">
                                {navItems.map((item) => (<NavLink key={item.to} to={item.to} onClick={closeMobile} className={linkClass}>
                                        <item.icon className="mr-3 h-5 w-5 shrink-0 opacity-90"/>
                                        {item.label}
                                    </NavLink>))}
                            </nav>
                        </div>
                        <div className="flex-shrink-0 border-t border-white/10 p-4 pb-safe">
                            <div className="flex items-center">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>)}

            <div className={`hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col transition-[width] duration-300 ease-out ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}>
                <div className="flex flex-col flex-grow bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-r border-white/10 pt-6 pb-4 overflow-y-auto shadow-xl shadow-indigo-950/30">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <BrandCloudButton className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/25 border-0 p-0 cursor-pointer hover:brightness-110 active:brightness-95 transition-[filter] duration-200"/>
                        {!collapsed && (<span className="ml-3 text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                                {t('brand.cloud')}
                            </span>)}
                        <button type="button" onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none transition-colors" aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}>
                            {collapsed ? <ChevronRight className="h-5 w-5"/> : <ChevronLeft className="h-5 w-5"/>}
                        </button>
                    </div>
                    <nav className="mt-8 flex-1 px-3 space-y-1">
                        {navItems.map((item) => (<NavLink key={item.to} to={item.to} className={linkClass} title={collapsed ? item.label : undefined}>
                                <item.icon className={`${collapsed ? 'mr-0' : 'mr-3'} h-5 w-5 shrink-0 opacity-90`}/>
                                {!collapsed && item.label}
                            </NavLink>))}
                    </nav>
                    <div className="flex-shrink-0 border-t border-white/10 p-4 mt-auto">
                        <div className="flex items-center w-full gap-2">
                            <div className={`${collapsed ? 'ml-0' : 'ml-0'} flex-1 min-w-0`}>
                                {!collapsed && (<>
                                        <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                    </>)}
                            </div>
                            <button type="button" onClick={handleLogout} className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-white/10 transition-colors" title={t('nav.logout')} aria-label={t('nav.logout')}>
                                <LogOut className="h-5 w-5"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>);
};
export default Sidebar;
