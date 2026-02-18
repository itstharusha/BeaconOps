// FILE: src/pages/ShipmentsPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchShipments, createShipment } from '@/store/shipmentSlice';
import { usePermissions } from '@/hooks/usePermissions';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { Plus, Search, Truck, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CARRIERS = ['fedex', 'ups', 'dhl', 'maersk', 'local'];

export default function ShipmentsPage() {
    const dispatch = useDispatch();
    const { items, loading } = useSelector((s) => s.shipments);
    const { hasPermission } = usePermissions();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ shipmentNumber: '', carrier: 'fedex', originAddress: '', destinationAddress: '', estimatedDepartureDate: '', estimatedArrivalDate: '' });

    useEffect(() => { dispatch(fetchShipments()); }, [dispatch]);

    const filtered = (items || []).filter((s) => {
        const matchSearch = s.shipmentNumber?.toLowerCase().includes(search.toLowerCase()) || s.carrier?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const handleCreate = async (e) => {
        e.preventDefault();
        const result = await dispatch(createShipment(form));
        if (createShipment.fulfilled.match(result)) { toast.success('Shipment created'); setShowCreate(false); }
        else toast.error(result.payload || 'Failed');
    };

    const statuses = ['all', 'registered', 'inTransit', 'delayed', 'rerouted', 'delivered', 'closed'];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Shipments</h1>
                    <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">{filtered.length} shipments</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input-field pl-9 w-48" />
                    </div>
                    {hasPermission('shipments:create') && (
                        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> New Shipment</button>
                    )}
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {statuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${statusFilter === s ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-ink-500 dark:text-ink-300 hover:bg-surface-200 dark:hover:bg-surface-850'}`}
                    >
                        {s === 'all' ? 'All' : s === 'inTransit' ? 'In Transit' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="card p-4 h-16 animate-pulse-soft" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Truck} title="No shipments found" />
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950">
                                    <th className="table-header">Shipment #</th>
                                    <th className="table-header">Carrier</th>
                                    <th className="table-header">Origin</th>
                                    <th className="table-header">Destination</th>
                                    <th className="table-header">Status</th>
                                    <th className="table-header">ETA</th>
                                    <th className="table-header text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s) => (
                                    <tr key={s._id} className="table-row">
                                        <td className="table-cell font-mono text-xs font-medium">{s.shipmentNumber}</td>
                                        <td className="table-cell capitalize text-xs">{s.carrier}</td>
                                        <td className="table-cell text-xs truncate max-w-[120px]">{s.origin?.address || s.originAddress || '—'}</td>
                                        <td className="table-cell text-xs truncate max-w-[120px]">{s.destination?.address || s.destinationAddress || '—'}</td>
                                        <td className="table-cell"><StatusBadge status={s.status} /></td>
                                        <td className="table-cell font-mono text-xs">
                                            {s.estimatedArrivalDate ? format(new Date(s.estimatedArrivalDate), 'MMM d') : '—'}
                                        </td>
                                        <td className="table-cell text-right">
                                            <Link to={`/shipments/${s._id}`} className="btn-ghost p-1.5 rounded-md"><ExternalLink size={14} /></Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Shipment" size="lg">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Shipment #</label>
                            <input value={form.shipmentNumber} onChange={set('shipmentNumber')} required className="input-field font-mono" placeholder="SHP-001" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Carrier</label>
                            <select value={form.carrier} onChange={set('carrier')} className="input-field">
                                {CARRIERS.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Origin</label>
                            <input value={form.originAddress} onChange={set('originAddress')} required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Destination</label>
                            <input value={form.destinationAddress} onChange={set('destinationAddress')} required className="input-field" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Departure Date</label>
                            <input type="date" value={form.estimatedDepartureDate} onChange={set('estimatedDepartureDate')} required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Arrival Date</label>
                            <input type="date" value={form.estimatedArrivalDate} onChange={set('estimatedArrivalDate')} required className="input-field" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Create Shipment</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
