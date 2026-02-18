// FILE: src/pages/AdminPage.jsx
import React, { useEffect, useState } from 'react';
import API from '@/services/api';
import { Settings, Save, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [triggering, setTriggering] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data } = await API.get('/admin/config');
            setConfig(data.data);
        } catch (err) {
            toast.error('Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await API.put('/admin/config', config);
            toast.success('Configuration saved');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleTriggerAgents = async () => {
        setTriggering(true);
        try {
            await API.post('/admin/trigger-agents');
            toast.success('Risk agents triggered successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to trigger agents');
        } finally {
            setTriggering(false);
        }
    };

    const updateThreshold = (field, value) => {
        setConfig({
            ...config,
            riskThresholds: {
                ...config.riskThresholds,
                [field]: Number(value),
            },
        });
    };

    if (loading) return <div className="card p-8 h-96 animate-pulse-soft" />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">Organization configuration & risk thresholds</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleTriggerAgents} disabled={triggering} className="btn-secondary">
                        {triggering ? (
                            <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-ink-300/30 border-t-ink-500 rounded-full animate-spin" />Running...</span>
                        ) : (
                            <span className="flex items-center gap-2"><Zap size={16} /> Trigger Agents</span>
                        )}
                    </button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary">
                        {saving ? 'Saving...' : <span className="flex items-center gap-2"><Save size={16} /> Save Changes</span>}
                    </button>
                </div>
            </div>

            {config && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risk Thresholds */}
                    <div className="card p-6 space-y-5">
                        <h3 className="section-title text-sm flex items-center gap-2"><Settings size={16} /> Risk Thresholds</h3>
                        <p className="text-xs text-ink-500">Define score boundaries for each risk tier.</p>
                        <div className="space-y-4">
                            {[
                                { label: 'Low → Medium', field: 'lowToMedium', color: 'bg-risk-medium' },
                                { label: 'Medium → High', field: 'mediumToHigh', color: 'bg-risk-high' },
                                { label: 'High → Critical', field: 'highToCritical', color: 'bg-risk-critical' },
                            ].map(({ label, field, color }) => (
                                <div key={field}>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-ink-700 dark:text-gray-300 flex items-center gap-2">
                                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
                                            {label}
                                        </label>
                                        <span className="text-sm font-mono text-ink-500">{config.riskThresholds?.[field] ?? 0}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0} max={100}
                                        value={config.riskThresholds?.[field] ?? 0}
                                        onChange={(e) => updateThreshold(field, e.target.value)}
                                        className="w-full h-1.5 bg-surface-200 dark:bg-surface-800 rounded-full appearance-none cursor-pointer accent-brand-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Escalation Rules */}
                    <div className="card p-6 space-y-5">
                        <h3 className="section-title text-sm">Escalation Rules</h3>
                        <p className="text-xs text-ink-500">Automatic escalation timings for unresolved alerts.</p>
                        <div className="space-y-3">
                            {config.escalationRules ? (
                                Object.entries(config.escalationRules).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-950">
                                        <span className="text-sm capitalize text-ink-700 dark:text-gray-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-mono text-sm text-ink-900 dark:text-gray-100">{typeof val === 'number' ? `${val} min` : JSON.stringify(val)}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-ink-500">No escalation rules configured.</p>
                            )}
                        </div>
                    </div>

                    {/* Notification Channels */}
                    <div className="card p-6 space-y-5">
                        <h3 className="section-title text-sm">Notification Channels</h3>
                        <div className="space-y-3">
                            {config.notificationChannels ? (
                                Object.entries(config.notificationChannels).map(([channel, enabled]) => (
                                    <div key={channel} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-950">
                                        <span className="text-sm capitalize text-ink-700 dark:text-gray-300">{channel}</span>
                                        <div className={`h-2.5 w-2.5 rounded-full ${enabled ? 'bg-risk-low' : 'bg-surface-300 dark:bg-surface-800'}`} />
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-ink-500">No channels configured.</p>
                            )}
                        </div>
                    </div>

                    {/* Agent Schedule */}
                    <div className="card p-6 space-y-5">
                        <h3 className="section-title text-sm">Agent Schedule</h3>
                        <p className="text-xs text-ink-500">Risk assessment agent run intervals.</p>
                        <div className="space-y-3">
                            {config.agentSchedules ? (
                                Object.entries(config.agentSchedules).map(([agent, schedule]) => (
                                    <div key={agent} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-950">
                                        <span className="text-sm capitalize text-ink-700 dark:text-gray-300">{agent.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-mono text-xs text-ink-500">{schedule}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-ink-500">No schedules configured.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
