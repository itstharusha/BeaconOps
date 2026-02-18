// FILE: src/components/ui/StatCard.jsx
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, variant = 'default', delay = 0 }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (typeof value !== 'number') { setDisplayValue(value); return; }
        const duration = 600;
        const steps = 30;
        const increment = value / steps;
        let current = 0;
        const timer = setTimeout(() => {
            const interval = setInterval(() => {
                current += increment;
                if (current >= value) {
                    setDisplayValue(value);
                    clearInterval(interval);
                } else {
                    setDisplayValue(Math.round(current));
                }
            }, duration / steps);
        }, delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    const variantStyles = {
        default: 'bg-white dark:bg-surface-900',
        critical: 'bg-red-50 dark:bg-red-950/30 border-risk-critical/20',
        warning: 'bg-amber-50 dark:bg-amber-950/30 border-risk-high/20',
        success: 'bg-green-50 dark:bg-green-950/30 border-risk-low/20',
    };

    return (
        <div className={clsx(
            'card-hover p-5 animate-slide-up',
            variantStyles[variant],
        )}>
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-300">
                        {title}
                    </p>
                    <p className="text-2xl font-semibold tracking-tighter text-ink-900 dark:text-gray-100 font-mono tabular-nums">
                        {displayValue}
                    </p>
                    {trendLabel && (
                        <p className={clsx(
                            'text-xs font-medium',
                            trend === 'up' && 'text-risk-critical',
                            trend === 'down' && 'text-risk-low',
                            !trend && 'text-ink-500',
                        )}>
                            {trend === 'up' && '↑ '}
                            {trend === 'down' && '↓ '}
                            {trendLabel}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800 text-ink-500 dark:text-ink-300">
                        <Icon size={20} />
                    </div>
                )}
            </div>
        </div>
    );
}
