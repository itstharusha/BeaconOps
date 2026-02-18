// FILE: src/pages/SuppliersPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchSuppliers, createSupplier, deleteSupplier } from '@/store/supplierSlice';
import { usePermissions } from '@/hooks/usePermissions';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { Plus, Search, Package, ExternalLink, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['raw_materials', 'components', 'finished_goods', 'services'];

export default function SuppliersPage() {
    const dispatch = useDispatch();
    const { items, loading } = useSelector((s) => s.suppliers);
    const { hasPermission } = usePermissions();
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', supplierCode: '', contactEmail: '', contactPhone: '', country: '', category: 'raw_materials' });

    useEffect(() => { dispatch(fetchSuppliers()); }, [dispatch]);

    const filtered = (items || []).filter((s) =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.supplierCode?.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async (e) => {
        e.preventDefault();
        const result = await dispatch(createSupplier(form));
        if (createSupplier.fulfilled.match(result)) {
            toast.success('Supplier created');
            setShowCreate(false);
            setForm({ name: '', supplierCode: '', contactEmail: '', contactPhone: '', country: '', category: 'raw_materials' });
        } else {
            toast.error(result.payload || 'Failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this supplier?')) return;
        const result = await dispatch(deleteSupplier(id));
        if (deleteSupplier.fulfilled.match(result)) toast.success('Supplier deleted');
    };

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Suppliers</h1>
                    <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">{filtered.length} suppliers</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search suppliers..."
                            className="input-field pl-9 w-64"
                        />
                    </div>
                    {hasPermission('suppliers:create') && (
                        <button onClick={() => setShowCreate(true)} className="btn-primary">
                            <Plus size={16} /> Add Supplier
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="card p-4 h-16 animate-pulse-soft" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Package} title="No suppliers found" description="Add your first supplier to start tracking." />
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950">
                                    <th className="table-header">Code</th>
                                    <th className="table-header">Name</th>
                                    <th className="table-header">Category</th>
                                    <th className="table-header">Country</th>
                                    <th className="table-header">Status</th>
                                    <th className="table-header">Lead Time</th>
                                    <th className="table-header">On-Time %</th>
                                    <th className="table-header text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s) => (
                                    <tr key={s._id} className="table-row">
                                        <td className="table-cell font-mono text-xs font-medium">{s.supplierCode}</td>
                                        <td className="table-cell font-medium text-ink-900 dark:text-gray-100">{s.name}</td>
                                        <td className="table-cell capitalize text-xs">{s.category?.replace('_', ' ')}</td>
                                        <td className="table-cell">{s.country}</td>
                                        <td className="table-cell"><StatusBadge status={s.status} /></td>
                                        <td className="table-cell font-mono text-xs">{s.leadTimeDays}d</td>
                                        <td className="table-cell font-mono text-xs">{s.performanceMetrics?.onTimeDeliveryRate ?? '—'}%</td>
                                        <td className="table-cell text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link to={`/suppliers/${s._id}`} className="btn-ghost p-1.5 rounded-md" title="View">
                                                    <ExternalLink size={14} />
                                                </Link>
                                                {hasPermission('suppliers:delete') && (
                                                    <button onClick={() => handleDelete(s._id)} className="btn-ghost p-1.5 rounded-md text-ink-300 hover:text-risk-critical" title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Supplier">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Name</label>
                            <input value={form.name} onChange={set('name')} required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Code</label>
                            <input value={form.supplierCode} onChange={set('supplierCode')} required className="input-field font-mono uppercase" placeholder="e.g. SUP-001" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Category</label>
                        <select value={form.category} onChange={set('category')} className="input-field">
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Email</label>
                            <input type="email" value={form.contactEmail} onChange={set('contactEmail')} required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Phone</label>
                            <input value={form.contactPhone} onChange={set('contactPhone')} required className="input-field" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Country</label>
                        <input value={form.country} onChange={set('country')} required className="input-field" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Create Supplier</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
