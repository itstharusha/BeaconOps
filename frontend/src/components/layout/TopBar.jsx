// FILE: src/components/layout/TopBar.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '@/store/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { Menu, Sun, Moon, LogOut, User } from 'lucide-react';

export default function TopBar({ onMenuToggle }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isDark, toggle } = useTheme();
    const user = useSelector((state) => state.auth.user);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/login');
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 lg:px-6">
            {/* Left: Mobile menu */}
            <button
                onClick={onMenuToggle}
                className="btn-ghost p-2 md:hidden"
                aria-label="Toggle menu"
            >
                <Menu size={20} />
            </button>

            <div className="hidden md:block" />

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
                {/* Theme toggle */}
                <button
                    onClick={toggle}
                    className="btn-ghost p-2 rounded-lg"
                    aria-label="Toggle theme"
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* User info */}
                <div className="flex items-center gap-3 ml-2 pl-3 border-l border-surface-200 dark:border-surface-800">
                    <div className="hidden sm:block text-right">
                        <p className="text-sm font-medium text-ink-900 dark:text-gray-100 leading-tight">
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-2xs text-ink-500 dark:text-ink-300 capitalize">
                            {user?.role?.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="btn-ghost p-2 rounded-lg text-ink-300 hover:text-risk-critical"
                        aria-label="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
