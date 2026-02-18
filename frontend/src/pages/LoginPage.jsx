// FILE: src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, clearError } from '@/store/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { Radio, Eye, EyeOff, Sun, Moon, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);
    const { isDark, toggle } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearError());
        const result = await dispatch(loginUser({
            email: email.trim(),
            password: password.trim()
        }));
        if (loginUser.fulfilled.match(result)) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950">
            {/* Left: Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
                    {/* Grid lines */}
                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                            <Radio size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-semibold tracking-tighter text-white">BeaconOps</span>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight text-white leading-tight mb-4">
                        Supply Chain<br />Intelligence Platform
                    </h1>

                    <p className="text-lg text-blue-100/80 max-w-md leading-relaxed">
                        Monitor risks, track shipments, and optimize inventory across your entire logistics network in real-time.
                    </p>

                    <div className="mt-12 grid grid-cols-3 gap-6">
                        {[
                            { label: 'Risk Detection', value: 'AI-Powered' },
                            { label: 'Response Time', value: '< 15 min' },
                            { label: 'Visibility', value: '360°' },
                        ].map((item) => (
                            <div key={item.label} className="border-t border-white/20 pt-3">
                                <p className="text-2xl font-bold text-white tracking-tight">{item.value}</p>
                                <p className="text-xs text-blue-200/60 mt-1 uppercase tracking-wider">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Theme toggle */}
                    <div className="flex justify-end mb-8">
                        <button onClick={toggle} className="btn-ghost p-2 rounded-lg" aria-label="Toggle theme">
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>

                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
                            <Radio size={20} />
                        </div>
                        <span className="text-xl font-semibold tracking-tighter text-ink-900 dark:text-gray-100">BeaconOps</span>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h2 className="text-2xl font-semibold tracking-tighter text-ink-900 dark:text-gray-100">
                            Welcome back
                        </h2>
                        <p className="text-sm text-ink-500 dark:text-ink-300">
                            Sign in to access your logistics dashboard
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-risk-critical dark:text-risk-critical-dark animate-slide-up">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="you@company.com"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="input-field pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-2.5"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign in <ArrowRight size={16} />
                                </span>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-300">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
