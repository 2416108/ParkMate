import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine page title based on path
  const getPageTitle = (path) => {
    if (path.includes('/admin/dashboard')) return 'Admin Overview';
    if (path.includes('/admin/slots')) return 'Parking Slot Management';
    if (path.includes('/admin/users')) return 'User Directory';
    if (path.includes('/admin/vehicles')) return 'Vehicle Directory';
    if (path.includes('/admin/bookings')) return 'All Bookings';
    if (path.includes('/admin/payments')) return 'Payment Records';
    if (path.includes('/admin/history')) return 'System Parking History';

    if (path.includes('/dashboard')) return 'Customer Dashboard';
    if (path.includes('/vehicles')) return 'My Registered Vehicles';
    if (path.includes('/find-parking')) return 'Find & Reserve Parking';
    if (path.includes('/bookings')) return 'My Bookings & Tickets';
    if (path.includes('/payments')) return 'Payments & Receipts';
    if (path.includes('/history')) return 'Parking History';
    if (path.includes('/profile')) return 'My Profile';

    return 'ParkMate';
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-[#F7FAF7] flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
        <footer className="border-t border-[#DDE5DD] bg-white py-3 px-6 text-center text-xs text-gray-500 no-print">
          <p>
            <span className="font-semibold text-gray-700">ParkMate</span> &bull; Parking Management System &bull; All Rights Reserved
          </p>
        </footer>
      </div>
    </div>
  );
}
