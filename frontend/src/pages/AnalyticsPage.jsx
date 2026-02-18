// FILE: src/pages/AnalyticsPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSupplierAnalytics, fetchDashboardStats } from '@/store/analyticsSlice';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const RISK_COLORS = { low: '#16A34A', medium: '#CA8A04', high: '#EA580C', critical: '#DC2626' };
const CATEGORY_COLORS = ['#2563EB', '#7C3AED', '#EA580C', '#16A34A', '#CA8A04', '#DC2626'];

export default function AnalyticsPage() {
    const dispatch = useDispatch();
    const { supplierAnalytics, dashboard, loading } = useSelector((s) => s.analytics);

    useEffect(() => {
        dispatch(fetchSupplierAnalytics());
        dispatch(fetchDashboardStats());
    }, [dispatch]);

    if (loading && !supplierAnalytics && !dashboard) {
        return (
            <div className="space-y-6 animate-fade-in">
                <h1 className="page-title">Analytics</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="card p-5 h-72 animate-pulse-soft" />)}
                </div>
            </div>
        );
    }

    const suppliersByCategory = supplierAnalytics?.byCategory || [];
    const categoryPieData = suppliersByCategory.map((c) => ({ name: c._id || c.category || 'Unknown', value: c.count || 0 }));

    const suppliersByRisk = supplierAnalytics?.byRiskTier || [];
    const riskBarData = suppliersByRisk.map((r) => ({ name: r._id || r.riskTier || 'Unknown', count: r.count || 0 }));

    const perfData = supplierAnalytics?.performanceOverview || [];
    const radarData = perfData.slice(0, 6).map((p) => ({
        subject: p.name || p._id || 'Unknown',
        onTime: p.avgOnTimeRate || p.onTimeDeliveryRate || 0,
        defect: p.avgDefectRate || p.defectRate || 0,
    }));

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title">Analytics</h1>
                <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">Supply chain performance insights</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Suppliers by Category */}
                <div className="card p-5">
                    <h3 className="section-title text-sm mb-4">Suppliers by Category</h3>
                    <div className="h-64">
                        {categoryPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={2} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                        {categoryPieData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-ink-300">No data available</div>
                        )}
                    </div>
                </div>

                {/* Suppliers by Risk Tier */}
                <div className="card p-5">
                    <h3 className="section-title text-sm mb-4">Suppliers by Risk Tier</h3>
                    <div className="h-64">
                        {riskBarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={riskBarData} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EB" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {riskBarData.map((entry) => <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#6B7085'} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-ink-300">No data available</div>
                        )}
                    </div>
                </div>

                {/* Performance Radar */}
                <div className="card p-5">
                    <h3 className="section-title text-sm mb-4">Supplier Performance Radar</h3>
                    <div className="h-64">
                        {radarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="#E2E5EB" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                                    <Radar name="On-Time %" dataKey="onTime" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
                                    <Radar name="Defect %" dataKey="defect" stroke="#DC2626" fill="#DC2626" fillOpacity={0.1} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-ink-300">No data available</div>
                        )}
                    </div>
                </div>

                {/* Quick Stats Summary */}
                <div className="card p-5">
                    <h3 className="section-title text-sm mb-4">Overview Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-950">
                            <p className="text-xs text-ink-300 mb-1">Total Suppliers</p>
                            <p className="text-2xl font-semibold font-mono tracking-tight text-ink-900 dark:text-gray-100">{supplierAnalytics?.totalSuppliers || 0}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-950">
                            <p className="text-xs text-ink-300 mb-1">Avg On-Time Rate</p>
                            <p className="text-2xl font-semibold font-mono tracking-tight text-risk-low">{supplierAnalytics?.avgOnTimeRate?.toFixed(1) || 0}%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-950">
                            <p className="text-xs text-ink-300 mb-1">High Risk Suppliers</p>
                            <p className="text-2xl font-semibold font-mono tracking-tight text-risk-high">{supplierAnalytics?.highRiskCount || 0}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-950">
                            <p className="text-xs text-ink-300 mb-1">Active Alerts</p>
                            <p className="text-2xl font-semibold font-mono tracking-tight text-risk-critical">{dashboard?.alerts?.open || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
