// FILE: src/App.jsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppShell from './components/layout/AppShell';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const SupplierDetailPage = lazy(() => import('./pages/SupplierDetailPage'));
const ShipmentsPage = lazy(() => import('./pages/ShipmentsPage'));
const ShipmentDetailPage = lazy(() => import('./pages/ShipmentDetailPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SimulationsPage = lazy(() => import('./pages/SimulationsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useSelector((state) => state.auth);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
}

function GuestRoute({ children }) {
    const { isAuthenticated } = useSelector((state) => state.auth);
    if (isAuthenticated) return <Navigate to="/" replace />;
    return children;
}

export default function App() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                {/* Guest routes */}
                <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

                {/* Protected routes inside AppShell */}
                <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                    <Route index element={<DashboardPage />} />
                    <Route path="suppliers" element={<SuppliersPage />} />
                    <Route path="suppliers/:id" element={<SupplierDetailPage />} />
                    <Route path="shipments" element={<ShipmentsPage />} />
                    <Route path="shipments/:id" element={<ShipmentDetailPage />} />
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="alerts" element={<AlertsPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="simulations" element={<SimulationsPage />} />
                    <Route path="admin" element={<AdminPage />} />
                    <Route path="users" element={<UsersPage />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}
