// FILE: src/pages/UsersPage.jsx
import React, { useEffect, useState } from 'react';
import API from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { Users, Plus, Search, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
    { value: 'orgAdmin', label: 'Org Admin' },
    { value: 'riskAnalyst', label: 'Risk Analyst' },
    { value: 'logisticsOperator', label: 'Logistics Operator' },
    { value: 'inventoryManager', label: 'Inventory Manager' },
    { value: 'viewer', label: 'Viewer' },
];

const ROLE_COLORS = {
    superAdmin: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    orgAdmin: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    riskAnalyst: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    logisticsOperator: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
    inventoryManager: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    viewer: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function UsersPage() {
    const { hasPermission } = usePermissions();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'viewer' });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await API.get('/users');
            setUsers(data.data?.data || data.data || []);
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filtered = users.filter((u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await API.post('/users', form);
            toast.success('User created');
            setShowCreate(false);
            setForm({ firstName: '', lastName: '', email: '', password: '', role: 'viewer' });
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create user');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this user?')) return;
        try {
            await API.delete(`/users/${id}`);
            toast.success('User deleted');
            setUsers(users.filter((u) => u._id !== id));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const roleLabel = (role) => role?.replace(/([A-Z])/g, ' $1').trim() || 'Unknown';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">{filtered.length} team members</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input-field pl-9 w-56" />
                    </div>
                    {hasPermission('users:create') && (
                        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> Add User</button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="card p-5 h-36 animate-pulse-soft" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Users} title="No users found" />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((user) => (
                        <div key={user._id} className="card-hover p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-semibold">
                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-ink-900 dark:text-gray-100">{user.firstName} {user.lastName}</p>
                                        <p className="text-xs text-ink-500 dark:text-ink-300">{user.email}</p>
                                    </div>
                                </div>
                                {hasPermission('users:delete') && (
                                    <button onClick={() => handleDelete(user._id)} className="btn-ghost p-1 rounded-md text-ink-300 hover:text-risk-critical"><Trash2 size={14} /></button>
                                )}
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <span className={`badge text-xs ${ROLE_COLORS[user.role] || ROLE_COLORS.viewer}`}>
                                    <Shield size={10} /> {roleLabel(user.role)}
                                </span>
                                <span className={`inline-block h-2 w-2 rounded-full ${user.status === 'active' ? 'bg-risk-low' : 'bg-surface-300'}`} title={user.status} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create User Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add User">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">First Name</label>
                            <input value={form.firstName} onChange={set('firstName')} required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Last Name</label>
                            <input value={form.lastName} onChange={set('lastName')} required className="input-field" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Email</label>
                        <input type="email" value={form.email} onChange={set('email')} required className="input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Password</label>
                        <input type="password" value={form.password} onChange={set('password')} required minLength={8} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Role</label>
                        <select value={form.role} onChange={set('role')} className="input-field">
                            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Create User</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
