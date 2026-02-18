// FILE: src/components/ui/LoadingScreen.jsx
import React from 'react';
import { Radio } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div className="flex h-screen items-center justify-center bg-surface-50 dark:bg-surface-950">
            <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white animate-pulse-soft">
                    <Radio size={24} />
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-soft" />
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-soft animate-delay-100" />
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-soft animate-delay-200" />
                </div>
            </div>
        </div>
    );
}
