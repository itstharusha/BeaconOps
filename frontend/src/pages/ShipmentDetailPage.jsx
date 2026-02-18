// FILE: src/pages/ShipmentDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchShipmentById, updateShipmentStatus, addTrackingEvent } from '@/store/shipmentSlice';
import { usePermissions } from '@/hooks/usePermissions';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, MapPin, Clock, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_TRANSITIONS = {
    registered: ['inTransit'],
    inTransit: ['delayed', 'rerouted', 'delivered'],
    delayed: ['inTransit', 'rerouted', 'delivered'],
    rerouted: ['inTransit', 'delivered'],
    delivered: ['closed'],
};

export default function ShipmentDetailPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { current: shipment } = useSelector((s) => s.shipments);
    const { hasPermission } = usePermissions();
    const [showTracking, setShowTracking] = useState(false);
    const [trackForm, setTrackForm] = useState({ location: '', description: '', status: '' });

    useEffect(() => { dispatch(fetchShipmentById(id)); }, [dispatch, id]);

    if (!shipment) return <div className="animate-pulse-soft card p-8 h-96" />;

    const nextStatuses = STATUS_TRANSITIONS[shipment.status] || [];

    const handleStatusChange = async (newStatus) => {
        const result = await dispatch(updateShipmentStatus({ id, status: newStatus }));
        if (updateShipmentStatus.fulfilled.match(result)) toast.success(`Status → ${newStatus}`);
        else toast.error(result.payload || 'Failed');
    };

    const handleTrackingSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(addTrackingEvent({ id, ...trackForm }));
        if (addTrackingEvent.fulfilled.match(result)) { toast.success('Tracking event added'); setShowTracking(false); setTrackForm({ location: '', description: '', status: '' }); }
        else toast.error(result.payload || 'Failed');
    };

    const events = shipment.trackingData?.events || [];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link to="/shipments" className="btn-ghost p-2 rounded-lg"><ArrowLeft size={18} /></Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="page-title">{shipment.shipmentNumber}</h1>
                        <StatusBadge status={shipment.status} />
                        {shipment.isDelayed && <StatusBadge status="delayed" />}
                    </div>
                    <p className="text-sm text-ink-500 dark:text-ink-300 mt-0.5 capitalize">{shipment.carrier}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Route Info */}
                <div className="card p-5 space-y-4">
                    <h3 className="section-title text-sm">Route Details</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-brand-100 dark:ring-brand-900/30 shrink-0" />
                            <div>
                                <p className="text-xs text-ink-300">Origin</p>
                                <p className="text-sm text-ink-700 dark:text-gray-300">{shipment.origin?.address || '—'}</p>
                            </div>
                        </div>
                        <div className="ml-1.5 border-l-2 border-dashed border-surface-300 dark:border-surface-800 h-6" />
                        <div className="flex items-start gap-3">
                            <div className="mt-1 h-3 w-3 rounded-full bg-risk-low ring-4 ring-green-100 dark:ring-green-900/30 shrink-0" />
                            <div>
                                <p className="text-xs text-ink-300">Destination</p>
                                <p className="text-sm text-ink-700 dark:text-gray-300">{shipment.destination?.address || '—'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-surface-200 dark:border-surface-800 pt-3 grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-ink-300">Departure</p>
                            <p className="text-sm font-mono">{shipment.estimatedDepartureDate ? format(new Date(shipment.estimatedDepartureDate), 'MMM d, yyyy') : '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-ink-300">ETA</p>
                            <p className="text-sm font-mono">{shipment.estimatedArrivalDate ? format(new Date(shipment.estimatedArrivalDate), 'MMM d, yyyy') : '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Status Actions */}
                <div className="card p-5 space-y-4">
                    <h3 className="section-title text-sm">Status Actions</h3>
                    {hasPermission('shipments:track') && nextStatuses.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-xs text-ink-300 mb-2">Transition to:</p>
                            {nextStatuses.map((ns) => (
                                <button key={ns} onClick={() => handleStatusChange(ns)} className="btn-secondary w-full justify-start">
                                    <CheckCircle2 size={14} />
                                    {ns === 'inTransit' ? 'In Transit' : ns.charAt(0).toUpperCase() + ns.slice(1)}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-ink-500">No transitions available.</p>
                    )}

                    {shipment.riskSignals && shipment.riskSignals.length > 0 && (
                        <div className="border-t border-surface-200 dark:border-surface-800 pt-3">
                            <p className="text-xs text-ink-300 mb-2">Risk Signals</p>
                            <div className="space-y-1.5">
                                {shipment.riskSignals.map((sig, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-risk-high">
                                        <AlertTriangle size={12} /> {sig.signal || sig}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tracking Events */}
                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="section-title text-sm">Tracking Events</h3>
                        {hasPermission('shipments:track') && (
                            <button onClick={() => setShowTracking(true)} className="btn-ghost p-1.5 rounded-md text-xs"><Plus size={14} /> Add</button>
                        )}
                    </div>
                    {events.length === 0 ? (
                        <p className="text-sm text-ink-500">No tracking events yet.</p>
                    ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {events.map((evt, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="relative flex flex-col items-center">
                                        <div className="h-2.5 w-2.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                                        {i < events.length - 1 && <div className="w-px flex-1 bg-surface-200 dark:bg-surface-800 mt-1" />}
                                    </div>
                                    <div className="pb-3">
                                        <p className="text-sm text-ink-700 dark:text-gray-300">{evt.description || evt.status}</p>
                                        <p className="text-xs text-ink-300 mt-0.5">
                                            {evt.location && <span>{evt.location} · </span>}
                                            {evt.timestamp ? format(new Date(evt.timestamp), 'MMM d, HH:mm') : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Items */}
            {shipment.items && shipment.items.length > 0 && (
                <div className="card p-5">
                    <h3 className="section-title text-sm mb-3">Items</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-800">
                                    <th className="table-header">SKU</th>
                                    <th className="table-header">Name</th>
                                    <th className="table-header">Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shipment.items.map((item, i) => (
                                    <tr key={i} className="table-row">
                                        <td className="table-cell font-mono text-xs">{item.sku}</td>
                                        <td className="table-cell">{item.name}</td>
                                        <td className="table-cell font-mono">{item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Tracking Modal */}
            <Modal isOpen={showTracking} onClose={() => setShowTracking(false)} title="Add Tracking Event">
                <form onSubmit={handleTrackingSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Location</label>
                        <input value={trackForm.location} onChange={(e) => setTrackForm({ ...trackForm, location: e.target.value })} required className="input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea value={trackForm.description} onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })} required className="input-field" rows={3} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowTracking(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Add Event</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
