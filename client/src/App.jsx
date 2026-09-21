import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import MyVehicles from './pages/customer/MyVehicles';
import FindParking from './pages/customer/FindParking';
import MyBookings from './pages/customer/MyBookings';
import Payments from './pages/customer/Payments';
import ParkingHistory from './pages/customer/ParkingHistory';
import Profile from './pages/customer/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSlots from './pages/admin/AdminSlots';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVehicles from './pages/admin/AdminVehicles';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPayments from './pages/admin/AdminPayments';
import AdminHistory from './pages/admin/AdminHistory';

// Route Guard for Protected Routes
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAF7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500 font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!adminOnly && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

// Redirect root to dashboard based on role
function RootRedirect() {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Customer Routes */}
            <Route
              element={
                <ProtectedRoute adminOnly={false}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/vehicles" element={<MyVehicles />} />
              <Route path="/find-parking" element={<FindParking />} />
              <Route path="/bookings" element={<MyBookings />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/history" element={<ParkingHistory />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route
              element={
                <ProtectedRoute adminOnly={true}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/slots" element={<AdminSlots />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/vehicles" element={<AdminVehicles />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/history" element={<AdminHistory />} />
            </Route>

            {/* Fallback 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
