import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { ParkingCircle, Mail, Lock, UserCheck, Shield } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isExpired = searchParams.get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      success(`Welcome back, ${user.name}!`);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F7FAF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-[#2E7D32] items-center justify-center text-white shadow-md mb-3">
          <ParkingCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">ParkMate</h2>
        <p className="text-sm text-gray-600 mt-1">Parking Management System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[#DDE5DD] sm:px-10">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Sign In</h3>
            <p className="text-xs text-gray-500 mt-1">Access your parking dashboard and reservations</p>
          </div>

          {isExpired && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
              Your session has expired. Please log in again to continue.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. demo@parkmate.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          {/* Quick Fill Helper */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              Quick Demo Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('demo@parkmate.com', 'Demo@123')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-[#DDE5DD] bg-[#F7FAF7] hover:bg-[#E8F5E9] hover:border-[#2E7D32] text-xs font-medium text-gray-800 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>Demo Customer</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@parkmate.com', 'Admin@123')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-[#DDE5DD] bg-[#F7FAF7] hover:bg-[#E8F5E9] hover:border-[#2E7D32] text-xs font-medium text-gray-800 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#2E7D32] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
