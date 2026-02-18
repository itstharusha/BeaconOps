// FILE: src/components/ui/StatusBadge.jsx
import React from 'react';
import clsx from 'clsx';

const severityMap = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
};

const statusMap = {
    // Shipment statuses
    registered: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    inTransit: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    delayed: 'badge-high',
    rerouted: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    delivered: 'badge-low',
    closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    // Supplier statuses
    active: 'badge-low',
    underWatch: 'badge-medium',
    highRisk: 'badge-high',
    suspended: 'badge-critical',
    // Inventory statuses
    adequate: 'badge-low',
    outOfStock: 'badge-critical',
    // Alert statuses
    generated: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    assigned: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    acknowledged: 'badge-medium',
    inReview: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    resolved: 'badge-low',
    archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    // Simulation
    pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    running: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    completed: 'badge-low',
    failed: 'badge-critical',
};

const labels = {
    inTransit: 'In Transit',
    underWatch: 'Under Watch',
    highRisk: 'High Risk',
    outOfStock: 'Out of Stock',
    inReview: 'In Review',
};

export default function StatusBadge({ status, severity, pulse = false, className }) {
    const key = severity || status;
    const style = severityMap[key] || statusMap[key] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    const label = labels[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : '—');

    return (
        <span className={clsx(
            'badge',
            style,
            pulse && key === 'critical' && 'animate-pulse-soft',
            className,
        )}>
            {(severity === 'critical' || status === 'critical') && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
            )}
            {label}
        </span>
    );
}
