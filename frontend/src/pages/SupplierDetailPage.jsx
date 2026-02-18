// FILE: src/pages/SupplierDetailPage.jsx
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSupplierById, fetchSupplierRiskHistory } from '@/store/supplierSlice';
import StatusBadge from '@/components/ui/StatusBadge';
import { ArrowLeft, MapPin, Mail, Phone, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SupplierDetailPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { current: supplier, riskHistory } = useSelector((s) => s.suppliers);

    useEffect(() => {
        dispatch(fetchSupplierById(id));
        dispatch(fetchSupplierRiskHistory(id));
    }, [dispatch, id]);

    if (!supplier) {
        return <div className="animate-pulse-soft card p-8 h-96" />;
    }

    const metrics = supplier.performanceMetrics || {};
    const financial = supplier.financialStability || {};

    const riskChartData = (riskHistory || []).map((h) => ({
        date: new Date(h.evaluatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: h.score || h.overallScore,
    }));

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link to="/suppliers" className="btn-ghost p-2 rounded-lg"><ArrowLeft size={18} /></Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="page-title">{supplier.name}</h1>
                        <StatusBadge status={supplier.status} />
                    </div>
                    <p className="text-sm text-ink-500 dark:text-ink-300 mt-0.5 font-mono">{supplier.supplierCode}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Contact Info */}
                <div className="card p-5 space-y-4">
                    <h3 className="section-title text-sm">Contact Information</h3>
                    <div className="space-y-3">
                        {supplier.contactPerson && (
                            <div className="flex items-center gap-2 text-sm"><span className="text-ink-700 dark:text-gray-300">{supplier.contactPerson}</span></div>
                        )}
                        {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-ink-500"><Mail size={14} />{supplier.email}</div>
                        )}
                        {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm text-ink-500"><Phone size={14} />{supplier.phone}</div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-ink-500"><MapPin size={14} />{supplier.country}</div>
                    </div>
                    <div className="border-t border-surface-200 dark:border-surface-800 pt-3">
                        <p className="text-xs text-ink-300">Category</p>
                        <p className="text-sm capitalize text-ink-700 dark:text-gray-300">{supplier.category?.replace('_', ' ')}</p>
                    </div>
                    <div>
                        <p className="text-xs text-ink-300">Lead Time</p>
                        <p className="text-sm font-mono text-ink-700 dark:text-gray-300">{supplier.leadTimeDays} days</p>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="card p-5 space-y-4">
                    <h3 className="section-title text-sm">Performance Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-ink-300 mb-1">On-Time Delivery</p>
                            <p className="text-2xl font-semibold font-mono tracking-tight text-ink-900 dark:text-gray-100">{metrics.onTimeDeliveryRate ?? '—'}%</p>
                            <div className="mt-1 h-1.5 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
                                <div className="h-full bg-risk-low rounded-full transition-all" style={{ width: `${metrics.onTimeDeliveryRate || 0}%` }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-ink-300 mb-1">Defect Rate</p>
                            <p className="text-2xl font-semibold font-mono tracking-tight text-ink-900 dark:text-gray-100">{metrics.defectRate ?? '—'}%</p>
                            <div className="mt-1 h-1.5 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
                                <div className="h-full bg-risk-high rounded-full transition-all" style={{ width: `${metrics.defectRate || 0}%` }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-ink-300 mb-1">Avg Delay</p>
                            <p className="text-xl font-semibold font-mono text-ink-900 dark:text-gray-100">{metrics.averageDelayDays ?? 0}d</p>
                        </div>
                        <div>
                            <p className="text-xs text-ink-300 mb-1">Total Shipments</p>
                            <p className="text-xl font-semibold font-mono text-ink-900 dark:text-gray-100">{metrics.totalShipments ?? 0}</p>
                        </div>
                    </div>
                </div>

                {/* Financial Stability */}
                <div className="card p-5 space-y-4">
                    <h3 className="section-title text-sm">Financial Stability</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
                            <span className="text-2xl font-bold tracking-tight text-ink-900 dark:text-gray-100">
                                {financial.rating || 'NR'}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-ink-300">Score</p>
                            <p className="text-xl font-semibold font-mono text-ink-900 dark:text-gray-100">{financial.score ?? 50}/100</p>
                        </div>
                    </div>
                    {supplier.geopoliticalRiskFlag && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-sm text-risk-critical">
                            ⚠ Geopolitical risk flag active
                        </div>
                    )}
                </div>
            </div>

            {/* Risk History Chart */}
            {riskChartData.length > 0 && (
                <div className="card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={16} className="text-ink-500" />
                        <h3 className="section-title text-sm">Risk Score History</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={riskChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EB" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
