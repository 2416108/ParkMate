import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Car,
  Search,
  CalendarCheck,
  CreditCard,
  History,
  User,
  LogOut,
  ParkingCircle,
  Users,
  Layers,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const customerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/vehicles', label: 'My Vehicles', icon: Car },
    { to: '/find-parking', label: 'Find Parking', icon: Search },
    { to: '/bookings', label: 'My Bookings', icon: CalendarCheck },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/history', label: 'Parking History', icon: History },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/slots', label: 'Parking Slots', icon: Layers },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/vehicles', label: 'Vehicles', icon: Car },
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    { to: '/admin/history', label: 'Parking History', icon: History },
  ];

  const links = isAdmin ? adminLinks : customerLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#DDE5DD] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#DDE5DD]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2E7D32] flex items-center justify-center text-white shadow-sm">
              <ParkingCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 tracking-tight leading-none text-base">ParkMate</h1>
              <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-0.5">
                {isAdmin ? 'Admin Portal' : 'Parking Management'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            {isAdmin ? 'Administration' : 'Customer Menu'}
          </div>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#E8F5E9] text-[#2E7D32]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-[#F7FAF7]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-[#DDE5DD] bg-[#F7FAF7]">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#2E7D32] font-semibold text-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-red-700 hover:bg-red-50 border border-[#DDE5DD] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
