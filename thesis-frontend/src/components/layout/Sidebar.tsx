import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home,
    Folder,
    Bell,
    User,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Cloud
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', icon: Home, label: 'Dashboard' },
        { to: '/groups', icon: Folder, label: 'Groups' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <>
            {/* Mobile sidebar */}
            <div className="lg:hidden fixed inset-0 z-40 flex">
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                    <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                        <div className="flex items-center flex-shrink-0 px-4">
                            <Cloud className="h-8 w-8 text-primary-600" />
                            <span className="ml-3 text-xl font-bold text-gray-900">CloudSync</span>
                        </div>
                        <nav className="mt-5 px-2 space-y-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                                            isActive
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    <item.icon className="mr-4 h-6 w-6" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700">{user?.username}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}>
                <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <Cloud className="h-8 w-8 text-primary-600" />
                        {!collapsed && (
                            <span className="ml-3 text-xl font-bold text-gray-900">CloudSync</span>
                        )}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="ml-auto p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                        </button>
                    </div>
                    <nav className="mt-5 flex-1 px-2 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                        isActive
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {!collapsed && item.label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                        <div className="flex items-center w-full">
                            <div className={`${collapsed ? 'ml-0' : 'ml-3'} flex-1`}>
                                {!collapsed && (
                                    <>
                                        <p className="text-sm font-medium text-gray-700 truncate">{user?.username}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="ml-2 p-1 text-gray-400 hover:text-gray-500"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;