import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen flex flex-col">
            <Sidebar
                mobileOpen={mobileNavOpen}
                onMobileClose={() => setMobileNavOpen(false)}
                collapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
            />
            <div
                className={`flex flex-col flex-1 min-h-screen transition-[padding] duration-300 ease-out ${
                    sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
                }`}
            >
                <Header onMenuClick={() => setMobileNavOpen(true)} />
                <main className="py-4 px-3 sm:py-6 sm:px-4 lg:px-8 flex-1 relative motion-safe:animate-fade-in pb-safe">
                    <div className="max-w-7xl mx-auto w-full min-w-0">
                        <Outlet />
                    </div>
                </main>
                <footer className="py-3 sm:py-4 px-3 sm:px-6 border-t border-white/40 dark:border-slate-700/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 transition-colors pb-safe">
                    Thesis Cloud Storage · группы, файлы, чат
                </footer>
            </div>
        </div>
    );
};

export default Layout;
