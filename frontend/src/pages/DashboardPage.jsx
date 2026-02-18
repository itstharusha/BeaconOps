// FILE: src/pages/DashboardPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchDashboardStats } from '@/store/analyticsSlice';
import { Bell, Truck, Boxes, Package, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const RISK_COLORS = { low: '#16A34A', medium: '#CA8A04', high: '#EA580C', critical: '#DC2626' };

export default function DashboardPage() {
    const dispatch = useDispatch();
    const { dashboard, loading } = useSelector((s) => s.analytics);

    useEffect(() => { dispatch(fetchDashboardStats()); }, [dispatch]);

    if (loading || !dashboard) {
        return (
            <div className="space-y-6 animate-fade-in">
                <h1 className="page-title">Dashboard</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card p-5 h-28 animate-pulse-soft">
                            <div className="h-3 w-20 bg-surface-200 dark:bg-surface-800 rounded mb-3" />
                            <div className="h-7 w-16 bg-surface-200 dark:bg-surface-800 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const { alerts, riskDistribution, shipments, criticalInventoryCount } = dashboard;

    const riskPieData = (dist) => {
        if (!dist) return [];
        return Object.entries(dist).map(([key, val]) => ({ name: key, value: val || 0 })).filter((d) => d.value > 0);
    };

    const shipmentBarData = [
        { name: 'In Transit', value: shipments?.inTransit || 0, color: '#5B8DEF' },
        { name: 'Delayed', value: shipments?.delayed || 0, color: '#EA580C' },
        { name: 'Delivered', value: shipments?.delivered || 0, color: '#16A34A' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">Real-time supply chain overview</p>
                </div>
                <p className="text-xs text-ink-300 dark:text-ink-500 font-mono">
                    Updated {new Date(dashboard.lastUpdated).toLocaleTimeString()}
                </p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Open Alerts"
                    value={alerts?.open || 0}
                    icon={Bell}
                    variant={alerts?.critical > 0 ? 'critical' : 'default'}
                    trendLabel={alerts?.critical > 0 ? `${alerts.critical} critical` : undefined}
                    trend={alerts?.critical > 0 ? 'up' : undefined}
                    delay={0}
                />
                <StatCard
                    title="Active Shipments"
                    value={shipments?.inTransit || 0}
                    icon={Truck}
                    trendLabel={shipments?.delayed > 0 ? `${shipments.delayed} delayed` : 'On track'}
                    trend={shipments?.delayed > 0 ? 'up' : 'down'}
                    delay={100}
                />
                <StatCard
                    title="Critical Inventory"
                    value={criticalInventoryCount || 0}
                    icon={Boxes}
                    variant={criticalInventoryCount > 0 ? 'warning' : 'success'}
                    delay={200}
                />
                <StatCard
                    title="Total Shipments"
                    value={shipments?.total || 0}
                    icon={Package}
                    delay={300}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Supplier Risk Distribution */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-title text-sm">Supplier Risk</h3>
                        <Link to="/suppliers" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                            View all <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={riskPieData(riskDistribution?.supplier)}
                                    cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={75}
                                    dataKey="value" paddingAngle={2}
                                >
                                    {riskPieData(riskDistribution?.supplier).map((entry) => (
                                        <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#6B7085'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--tw-bg-opacity, #fff)', border: '1px solid #E2E5EB', borderRadius: '8px', fontSize: '12px' }}
                                />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Shipment Pipeline */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-title text-sm">Shipment Pipeline</h3>
                        <Link to="/shipments" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                            View all <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={shipmentBarData} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EB" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {shipmentBarData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alert Summary */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-title text-sm">Alert Breakdown</h3>
                        <Link to="/alerts" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                            View all <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {['critical', 'high', 'medium', 'low'].map((sev) => (
                            <div key={sev} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <StatusBadge severity={sev} pulse={sev === 'critical'} />
                                </div>
                                <span className="font-mono text-sm font-semibold text-ink-900 dark:text-gray-100 tabular-nums">
                                    {alerts?.[sev] || 0}
                                </span>
                            </div>
                        ))}
                        <div className="border-t border-surface-200 dark:border-surface-800 pt-3 flex items-center justify-between">
                            <span className="text-xs text-ink-500">Resolved</span>
                            <span className="font-mono text-sm text-ink-500 tabular-nums">{alerts?.resolved || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory + Shipment Risk Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-5">
                    <h3 className="section-title text-sm mb-4">Shipment Risk Distribution</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={riskPieData(riskDistribution?.shipment)}
                                    cx="50%" cy="50%"
                                    innerRadius={45} outerRadius={70}
                                    dataKey="value" paddingAngle={2}
                                >
                                    {riskPieData(riskDistribution?.shipment).map((entry) => (
                                        <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#6B7085'} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card p-5">
                    <h3 className="section-title text-sm mb-4">Inventory Risk Distribution</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={riskPieData(riskDistribution?.inventory)}
                                    cx="50%" cy="50%"
                                    innerRadius={45} outerRadius={70}
                                    dataKey="value" paddingAngle={2}
                                >
                                    {riskPieData(riskDistribution?.inventory).map((entry) => (
                                        <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#6B7085'} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
