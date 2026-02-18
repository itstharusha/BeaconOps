// FILE: src/hooks/usePermissions.js
import { useSelector } from 'react-redux';

const ROLE_PERMISSIONS = {
    superAdmin: ['*'],
    orgAdmin: [
        'users:create', 'users:read', 'users:update', 'users:delete', 'users:assignRoles',
        'suppliers:create', 'suppliers:read', 'suppliers:update', 'suppliers:delete', 'suppliers:overrideRisk',
        'shipments:create', 'shipments:read', 'shipments:update', 'shipments:delete', 'shipments:track',
        'inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete', 'inventory:adjustForecast',
        'alerts:create', 'alerts:read', 'alerts:assign', 'alerts:acknowledge', 'alerts:resolve', 'alerts:override',
        'analytics:viewReports', 'analytics:exportReports', 'analytics:customReports',
        'simulations:execute', 'simulations:view', 'simulations:export',
        'admin:systemConfig', 'admin:auditLogs',
    ],
    riskAnalyst: [
        'suppliers:read', 'suppliers:overrideRisk',
        'shipments:read', 'shipments:track',
        'inventory:read',
        'alerts:create', 'alerts:read', 'alerts:assign', 'alerts:acknowledge', 'alerts:resolve', 'alerts:override',
        'analytics:viewReports', 'analytics:exportReports', 'analytics:customReports',
        'simulations:execute', 'simulations:view', 'simulations:export',
    ],
    logisticsOperator: [
        'shipments:create', 'shipments:read', 'shipments:update', 'shipments:track',
        'suppliers:read',
        'inventory:read',
        'alerts:read', 'alerts:acknowledge', 'alerts:resolve',
        'analytics:viewReports',
    ],
    inventoryManager: [
        'inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete', 'inventory:adjustForecast',
        'suppliers:read',
        'alerts:read', 'alerts:acknowledge', 'alerts:resolve',
        'analytics:viewReports', 'analytics:exportReports',
    ],
    viewer: [
        'suppliers:read',
        'shipments:read', 'shipments:track',
        'inventory:read',
        'alerts:read',
        'analytics:viewReports',
    ],
};

export function usePermissions() {
    const user = useSelector((state) => state.auth.user);
    const role = user?.role || 'viewer';
    const permissions = user?.permissions || ROLE_PERMISSIONS[role] || [];

    const hasPermission = (perm) => {
        if (permissions.includes('*')) return true;
        if (Array.isArray(perm)) return perm.some((p) => permissions.includes(p));
        return permissions.includes(perm);
    };

    const hasRole = (roles) => {
        if (Array.isArray(roles)) return roles.includes(role);
        return role === roles;
    };

    return { role, permissions, hasPermission, hasRole };
}
