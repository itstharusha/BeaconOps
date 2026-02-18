// FILE: src/pages/InventoryPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventory, createInventoryItem, adjustStock } from '@/store/inventorySlice';
import { usePermissions } from '@/hooks/usePermissions';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { Plus, Search, Boxes, PackageMinus, PackagePlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
    const dispatch = useDispatch();
    const { items, loading } = useSelector((s) => s.inventory);
    const { hasPermission } = usePermissions();
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showAdjust, setShowAdjust] = useState(null);
    const [adjustForm, setAdjustForm] = useState({ adjustment: 0, reason: '' });
    const [form, setForm] = useState({ sku: '', productName: '', currentStock: 0, reorderPoint: 10, safetyStock: 5, leadTimeDays: 7, averageDailyDemand: 1, unitCost: 0 });

    useEffect(() => { dispatch(fetchInventory()); }, [dispatch]);

    const filtered = (items || []).filter((i) =>
        i.sku?.toLowerCase().includes(search.toLowerCase()) ||
        i.productName?.toLowerCase().includes(search.toLowerCase())
    );

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value });

    const handleCreate = async (e) => {
        e.preventDefault();
        const result = await dispatch(createInventoryItem(form));
        if (createInventoryItem.fulfilled.match(result)) { toast.success('Item created'); setShowCreate(false); }
        else toast.error(result.payload || 'Failed');
    };

    const handleAdjust = async (e) => {
        e.preventDefault();
        const result = await dispatch(adjustStock({ id: showAdjust._id, ...adjustForm }));
        if (adjustStock.fulfilled.match(result)) { toast.success('Stock adjusted'); setShowAdjust(null); setAdjustForm({ adjustment: 0, reason: '' }); }
        else toast.error(result.payload || 'Failed');
    };

    const getStockColor = (item) => {
        if (item.currentStock <= 0) return 'text-risk-critical';
        if (item.currentStock <= (item.safetyStock || 0)) return 'text-risk-high';
        if (item.currentStock <= (item.reorderPoint || 0)) return 'text-risk-medium';
        return 'text-risk-low';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Inventory</h1>
                    <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">{filtered.length} items</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SKU or product..." className="input-field pl-9 w-56" />
                    </div>
                    {hasPermission('inventory:create') && (
                        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> Add Item</button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="card p-4 h-16 animate-pulse-soft" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Boxes} title="No inventory items" />
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950">
                                    <th className="table-header">SKU</th>
                                    <th className="table-header">Product</th>
                                    <th className="table-header text-right">Stock</th>
                                    <th className="table-header text-right">Reorder Pt</th>
                                    <th className="table-header text-right">Safety</th>
                                    <th className="table-header text-right">Days Cover</th>
                                    <th className="table-header">Status</th>
                                    <th className="table-header text-right">Unit Cost</th>
                                    <th className="table-header text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => (
                                    <tr key={item._id} className="table-row">
                                        <td className="table-cell font-mono text-xs font-medium">{item.sku}</td>
                                        <td className="table-cell font-medium text-ink-900 dark:text-gray-100">{item.productName}</td>
                                        <td className={`table-cell text-right font-mono font-semibold ${getStockColor(item)}`}>{item.currentStock}</td>
                                        <td className="table-cell text-right font-mono text-xs">{item.reorderPoint}</td>
                                        <td className="table-cell text-right font-mono text-xs">{item.safetyStock}</td>
                                        <td className="table-cell text-right font-mono text-xs">{item.daysOfCover ?? '—'}</td>
                                        <td className="table-cell"><StatusBadge status={item.status} /></td>
                                        <td className="table-cell text-right font-mono text-xs">${item.unitCost?.toFixed(2)}</td>
                                        <td className="table-cell text-right">
                                            {hasPermission('inventory:update') && (
                                                <button onClick={() => setShowAdjust(item)} className="btn-ghost p-1.5 rounded-md text-xs" title="Adjust stock">
                                                    <PackagePlus size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Inventory Item" size="lg">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">SKU</label>
                            <input value={form.sku} onChange={set('sku')} required className="input-field font-mono" placeholder="SKU-001" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Product Name</label>
                            <input value={form.productName} onChange={set('productName')} required className="input-field" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Initial Stock</label>
                            <input type="number" value={form.currentStock} onChange={set('currentStock')} min={0} required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Reorder Point</label>
                            <input type="number" value={form.reorderPoint} onChange={set('reorderPoint')} min={0} required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Safety Stock</label>
                            <input type="number" value={form.safetyStock} onChange={set('safetyStock')} min={0} required className="input-field" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Lead Time (days)</label>
                            <input type="number" value={form.leadTimeDays} onChange={set('leadTimeDays')} min={1} required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Avg Daily Demand</label>
                            <input type="number" value={form.averageDailyDemand} onChange={set('averageDailyDemand')} min={0} step={0.1} required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Unit Cost ($)</label>
                            <input type="number" value={form.unitCost} onChange={set('unitCost')} min={0} step={0.01} required className="input-field" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Create Item</button>
                    </div>
                </form>
            </Modal>

            {/* Adjust Stock Modal */}
            <Modal isOpen={!!showAdjust} onClose={() => setShowAdjust(null)} title={`Adjust Stock — ${showAdjust?.sku}`}>
                <form onSubmit={handleAdjust} className="space-y-4">
                    <p className="text-sm text-ink-500">Current stock: <span className="font-mono font-semibold text-ink-900 dark:text-gray-100">{showAdjust?.currentStock}</span></p>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Adjustment (+/-)</label>
                        <input type="number" value={adjustForm.adjustment} onChange={(e) => setAdjustForm({ ...adjustForm, adjustment: Number(e.target.value) })} required className="input-field font-mono" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Reason</label>
                        <textarea value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} required className="input-field" rows={2} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowAdjust(null)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Adjust Stock</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
