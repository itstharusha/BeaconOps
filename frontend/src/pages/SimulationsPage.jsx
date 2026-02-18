// FILE: src/pages/SimulationsPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSimulations, runSimulation } from '@/store/simulationSlice';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { FlaskConical, Play, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const SIM_TYPES = [
    { value: 'supplierFailure', label: 'Supplier Failure', desc: 'Simulate a supplier going offline' },
    { value: 'shipmentDelay', label: 'Shipment Delay', desc: 'Simulate delays in shipment arrivals' },
    { value: 'demandSpike', label: 'Demand Spike', desc: 'Simulate a sudden increase in demand' },
];

export default function SimulationsPage() {
    const dispatch = useDispatch();
    const { items, running, loading } = useSelector((s) => s.simulations);
    const [showRun, setShowRun] = useState(false);
    const [simType, setSimType] = useState('supplierFailure');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [expanded, setExpanded] = useState(null);

    useEffect(() => { dispatch(fetchSimulations()); }, [dispatch]);

    const handleRun = async (e) => {
        e.preventDefault();
        const body = { simulationType: simType, title, description };
        const result = await dispatch(runSimulation(body));
        if (runSimulation.fulfilled.match(result)) { toast.success('Simulation completed'); setShowRun(false); setTitle(''); setDescription(''); }
        else toast.error(result.payload || 'Simulation failed');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Simulations</h1>
                    <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">What-if analysis for supply chain disruptions</p>
                </div>
                <button onClick={() => setShowRun(true)} className="btn-primary">
                    <Play size={16} /> Run Simulation
                </button>
            </div>

            {loading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="card p-4 h-20 animate-pulse-soft" />)}</div>
            ) : (items || []).length === 0 ? (
                <EmptyState icon={FlaskConical} title="No simulations yet" description="Run your first what-if scenario to see impact analysis." />
            ) : (
                <div className="space-y-3">
                    {(items || []).map((sim) => (
                        <div key={sim._id} className="card-hover p-5" onClick={() => setExpanded(expanded === sim._id ? null : sim._id)}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <StatusBadge status={sim.status} />
                                        <span className="text-2xs text-ink-300 font-mono uppercase">{sim.simulationType?.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-ink-900 dark:text-gray-100">{sim.title}</h3>
                                    {sim.description && <p className="text-xs text-ink-500 mt-0.5">{sim.description}</p>}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs text-ink-300 flex items-center gap-1"><Clock size={10} />{sim.createdAt ? format(new Date(sim.createdAt), 'MMM d, HH:mm') : '—'}</p>
                                    {sim.executionTime && <p className="text-2xs text-ink-300 mt-1">{sim.executionTime}ms</p>}
                                </div>
                            </div>

                            {/* Expanded Results */}
                            {expanded === sim._id && sim.results && (
                                <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-800 animate-slide-up">
                                    <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">Results</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {sim.results.affectedSuppliers !== undefined && (
                                            <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-950">
                                                <p className="text-xs text-ink-300">Affected Suppliers</p>
                                                <p className="text-xl font-semibold font-mono text-ink-900 dark:text-gray-100">{sim.results.affectedSuppliers}</p>
                                            </div>
                                        )}
                                        {sim.results.affectedShipments !== undefined && (
                                            <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-950">
                                                <p className="text-xs text-ink-300">Affected Shipments</p>
                                                <p className="text-xl font-semibold font-mono text-ink-900 dark:text-gray-100">{sim.results.affectedShipments}</p>
                                            </div>
                                        )}
                                        {sim.results.riskScoreChange !== undefined && (
                                            <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-950">
                                                <p className="text-xs text-ink-300">Risk Score Impact</p>
                                                <p className="text-xl font-semibold font-mono text-risk-high">+{sim.results.riskScoreChange}</p>
                                            </div>
                                        )}
                                    </div>
                                    {sim.results.recommendations && sim.results.recommendations.length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            <p className="text-xs font-semibold text-ink-500">Recommendations</p>
                                            {sim.results.recommendations.map((rec, i) => (
                                                <div key={i} className="text-xs text-ink-700 dark:text-gray-300 p-2 rounded bg-blue-50 dark:bg-blue-950/20">💡 {rec}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Run Simulation Modal */}
            <Modal isOpen={showRun} onClose={() => setShowRun(false)} title="Run Simulation">
                <form onSubmit={handleRun} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-2">Scenario Type</label>
                        <div className="space-y-2">
                            {SIM_TYPES.map((t) => (
                                <label key={t.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${simType === t.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-surface-200 dark:border-surface-800 hover:border-surface-300'}`}>
                                    <input type="radio" name="simType" value={t.value} checked={simType === t.value} onChange={(e) => setSimType(e.target.value)} className="mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-ink-900 dark:text-gray-100">{t.label}</p>
                                        <p className="text-xs text-ink-500">{t.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Title</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input-field" placeholder="What-if scenario name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={2} placeholder="Optional description..." />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowRun(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={running} className="btn-primary">
                            {running ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Running...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2"><Play size={14} /> Run</span>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
