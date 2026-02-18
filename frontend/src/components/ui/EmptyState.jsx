// FILE: src/components/ui/EmptyState.jsx
import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data', description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800 text-ink-300 dark:text-ink-500 mb-4">
                <Icon size={28} />
            </div>
            <h3 className="text-sm font-semibold text-ink-700 dark:text-gray-300 mb-1">{title}</h3>
            {description && <p className="text-sm text-ink-500 dark:text-ink-300 max-w-sm">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
