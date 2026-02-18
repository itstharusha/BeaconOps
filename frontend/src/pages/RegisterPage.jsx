// FILE: src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { Radio, Eye, EyeOff, Sun, Moon, ArrowRight } from 'lucide-react';
import API from '@/services/api';
import toast from 'react-hot-toast';

const ROLES = [
    { value: 'orgAdmin', label: 'Org Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'operator', label: 'Operator' },
    { value: 'viewer', label: 'Viewer' },
    { value: 'riskAnalyst', label: 'Risk Analyst' },
];

export default function RegisterPage() {
    const navigate = useNavigate();
    const { isDark, toggle } = useTheme();

    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', password: '', role: 'viewer',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await API.post('/auth/register', form);
            toast.success('Account created! Please sign in.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-6 py-12">
            <div className="w-full max-w-md">
                {/* Theme toggle */}
                <div className="flex justify-end mb-6">
                    <button onClick={toggle} className="btn-ghost p-2 rounded-lg" aria-label="Toggle theme">
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>

                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
                        <Radio size={20} />
                    </div>
                    <span className="text-xl font-semibold tracking-tighter text-ink-900 dark:text-gray-100">BeaconOps</span>
                </div>

                <div className="space-y-2 mb-8">
                    <h2 className="text-2xl font-semibold tracking-tighter text-ink-900 dark:text-gray-100">
                        Create your account
                    </h2>
                    <p className="text-sm text-ink-500 dark:text-ink-300">
                        Join the supply chain intelligence platform
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-risk-critical dark:text-risk-critical-dark animate-slide-up">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">First name</label>
                            <input id="firstName" value={form.firstName} onChange={set('firstName')} required className="input-field" placeholder="Jane" />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">Last name</label>
                            <input id="lastName" value={form.lastName} onChange={set('lastName')} required className="input-field" placeholder="Doe" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="reg-email" className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">Email</label>
                        <input id="reg-email" type="email" value={form.email} onChange={set('email')} required className="input-field" placeholder="you@company.com" />
                    </div>

                    <div>
                        <label htmlFor="reg-password" className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                id="reg-password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={set('password')}
                                required
                                minLength={8}
                                className="input-field pr-10"
                                placeholder="Min 8 characters"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">Role</label>
                        <select id="role" value={form.role} onChange={set('role')} className="input-field">
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating account...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">Create account <ArrowRight size={16} /></span>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-300">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
