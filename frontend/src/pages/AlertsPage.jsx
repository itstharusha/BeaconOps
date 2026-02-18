// FILE: src/pages/AlertsPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAlerts, acknowledgeAlert, resolveAlert } from '@/store/alertSlice';
import { usePermissions } from '@/hooks/usePermissions';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { Bell, CheckCircle, XCircle, Clock, User, Shield } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function AlertsPage() {
    const dispatch = useDispatch();
    const { items, loading } = useSelector((s) => s.alerts);
    const { hasPermission } = usePermissions();
    const [severityFilter, setSeverityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [resolveModal, setResolveModal] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState('');

    useEffect(() => { dispatch(fetchAlerts()); }, [dispatch]);

    const filtered = (items || []).filter((a) => {
        const matchSev = severityFilter === 'all' || a.severity === severityFilter;
        const matchStatus = statusFilter === 'all' || a.status === statusFilter;
        return matchSev && matchStatus;
    });

    const handleAcknowledge = async (id) => {
        const result = await dispatch(acknowledgeAlert(id));
        if (acknowledgeAlert.fulfilled.match(result)) toast.success('Alert acknowledged');
    };

    const handleResolve = async (e) => {
        e.preventDefault();
        const result = await dispatch(resolveAlert({ id: resolveModal._id, resolutionNotes }));
        if (resolveAlert.fulfilled.match(result)) { toast.success('Alert resolved'); setResolveModal(null); setResolutionNotes(''); }
    };

    const severities = ['all', 'critical', 'high', 'medium', 'low'];
    const statuses = ['all', 'generated', 'assigned', 'acknowledged', 'inReview', 'resolved'];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title">Alerts</h1>
                <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">{filtered.length} alerts</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex gap-1">
                    <span className="text-xs text-ink-300 self-center mr-2">Severity:</span>
                    {severities.map((s) => (
                        <button key={s} onClick={() => setSeverityFilter(s)} className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${severityFilter === s ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-ink-500 hover:bg-surface-200'}`}>
                            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    <span className="text-xs text-ink-300 self-center mr-2">Status:</span>
                    {statuses.map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${statusFilter === s ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-ink-500 hover:bg-surface-200'}`}>
                            {s === 'all' ? 'All' : s === 'inReview' ? 'In Review' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="card p-4 h-20 animate-pulse-soft" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Bell} title="No alerts found" description="All clear — no alerts match your filters." />
            ) : (
                <div className="space-y-2">
                    {filtered.map((alert) => (
                        <div key={alert._id} className="card-hover p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <StatusBadge severity={alert.severity} pulse={alert.severity === 'critical' && alert.status !== 'resolved'} />
                                        <StatusBadge status={alert.status} />
                                        <span className="text-2xs text-ink-300 font-mono">
                                            {alert.alertType?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-ink-900 dark:text-gray-100 truncate">{alert.title}</h3>
                                    <p className="text-xs text-ink-500 dark:text-ink-300 mt-0.5 line-clamp-2">{alert.description}</p>
                                    <div className="flex items-center gap-3 mt-2 text-2xs text-ink-300">
                                        <span className="flex items-center gap-1"><Clock size={10} />{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                                        {alert.relatedEntity?.entityType && (
                                            <span className="flex items-center gap-1"><Shield size={10} />{alert.relatedEntity.entityType}</span>
                                        )}
                                        {alert.assignee && (
                                            <span className="flex items-center gap-1"><User size={10} />Assigned</span>
                                        )}
                                    </div>
                                    {alert.recommendations && alert.recommendations.length > 0 && (
                                        <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-xs text-blue-700 dark:text-blue-300">
                                            💡 {alert.recommendations[0]}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    {hasPermission('alerts:assign') && alert.status !== 'resolved' && alert.status !== 'archived' && (
                                        <>
                                            {alert.status !== 'acknowledged' && (
                                                <button onClick={() => handleAcknowledge(alert._id)} className="btn-ghost p-1.5 rounded-md text-xs text-brand-500" title="Acknowledge">
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => setResolveModal(alert)} className="btn-ghost p-1.5 rounded-md text-xs text-risk-low" title="Resolve">
                                                <XCircle size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Resolve Modal */}
            <Modal isOpen={!!resolveModal} onClose={() => setResolveModal(null)} title="Resolve Alert">
                <form onSubmit={handleResolve} className="space-y-4">
                    <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-950">
                        <p className="text-sm font-medium text-ink-900 dark:text-gray-100">{resolveModal?.title}</p>
                        <p className="text-xs text-ink-500 mt-1">{resolveModal?.description}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Resolution Notes</label>
                        <textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} required className="input-field" rows={3} placeholder="Describe how this was resolved..." />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setResolveModal(null)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Resolve Alert</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
