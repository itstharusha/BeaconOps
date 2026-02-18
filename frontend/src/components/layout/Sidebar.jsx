// FILE: src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import {
    LayoutDashboard, Package, Truck, Boxes, Bell,
    BarChart3, FlaskConical, Settings, Users, ChevronLeft,
    Radio,
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', perm: 'analytics:viewReports' },
    { to: '/suppliers', icon: Package, label: 'Suppliers', perm: 'suppliers:read' },
    { to: '/shipments', icon: Truck, label: 'Shipments', perm: 'shipments:read' },
    { to: '/inventory', icon: Boxes, label: 'Inventory', perm: 'inventory:read' },
    { to: '/alerts', icon: Bell, label: 'Alerts', perm: 'alerts:read' },
    { divider: true },
    { to: '/analytics', icon: BarChart3, label: 'Analytics', perm: 'analytics:viewReports' },
    { to: '/simulations', icon: FlaskConical, label: 'Simulations', perm: 'simulations:view' },
    { divider: true },
    { to: '/users', icon: Users, label: 'Users', perm: 'users:read' },
    { to: '/admin', icon: Settings, label: 'Settings', perm: ['admin:systemConfig', 'admin:agentControl'] },
];

export default function Sidebar({ collapsed, onToggle }) {
    const { hasPermission } = usePermissions();

    return (
        <aside
            className={`
                flex flex-col border-r border-surface-200 dark:border-surface-800
                bg-white dark:bg-surface-900 transition-all duration-300 ease-in-out
                ${collapsed ? 'w-16' : 'w-64'}
                hidden md:flex
            `}
        >
            {/* Brand */}
            <div className="flex h-16 items-center gap-3 px-4 border-b border-surface-200 dark:border-surface-800">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
                    <Radio size={18} />
                </div>
                {!collapsed && (
                    <span className="text-base font-semibold tracking-tighter text-ink-900 dark:text-gray-100 animate-fade-in">
                        BeaconOps
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                {navItems.map((item, i) => {
                    if (item.divider) {
                        return (
                            <div key={`div-${i}`} className="my-2 border-t border-surface-200 dark:border-surface-800" />
                        );
                    }

                    if (!hasPermission(item.perm)) return null;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                isActive ? 'nav-link-active' : 'nav-link'
                            }
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon size={20} className="shrink-0" />
                            {!collapsed && (
                                <span className="truncate animate-fade-in">{item.label}</span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={onToggle}
                className="flex h-12 items-center justify-center border-t border-surface-200 dark:border-surface-800 text-ink-300 hover:text-ink-700 dark:hover:text-gray-300 transition-colors"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                <ChevronLeft
                    size={18}
                    className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
                />
            </button>
        </aside>
    );
}
