import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ParkingTicket from '../../components/documents/ParkingTicket';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  Car,
  Search,
  CheckCircle,
  Clock,
  ArrowRight,
  Ticket,
  LogOut,
  History,
  Layers,
  CalendarCheck,
  CreditCard,
  Plus
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeParking, setActiveParking] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [stats, setStats] = useState({
    availableSlots: 0,
    totalBookings: 0,
    totalSpent: 0
  });

  // Ticket modal state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [exiting, setExiting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [activeRes, bookingsRes, slotsRes] = await Promise.all([
        api.get('/parking/active'),
        api.get('/bookings'),
        api.get('/parking-slots?status=Available')
      ]);

      setActiveParking(activeRes.data.activeBooking);
      const bookings = bookingsRes.data.bookings || [];
      setRecentBookings(bookings.slice(0, 5));

      // Calculate total amount paid
      const totalSpent = bookings
        .filter(b => b.status === 'Completed' || b.payment_status === 'Paid')
        .reduce((sum, b) => sum + (parseFloat(b.estimated_amount) || 0), 0);

      setStats({
        availableSlots: slotsRes.data.count || 0,
        totalBookings: bookings.length,
        totalSpent
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRecordExit = async () => {
    if (!activeParking) return;
    setExiting(true);
    try {
      const res = await api.post('/parking/exit', { booking_id: activeParking.booking_id });
      success(res.data.message || 'Vehicle exit recorded! Slot released.');
      setExitDialogOpen(false);
      fetchDashboardData();
      navigate('/history');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record vehicle exit.');
    } finally {
      setExiting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#2E7D32] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome, {user?.name || 'Customer'}!
          </h2>
          <p className="text-xs text-green-100 mt-1">
            Reserve parking slots, manage your registered vehicles, and view parking passes.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/find-parking">
            <Button variant="secondary" icon={Search} size="sm">
              Book a Slot
            </Button>
          </Link>
          <Link to="/vehicles">
            <Button variant="outline" icon={Plus} size="sm" className="bg-white/10 hover:bg-white/20 border-white/30 text-white">
              My Vehicles
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Parking"
          value={activeParking ? '1 Session' : 'None'}
          subtitle={activeParking ? `Slot ${activeParking.slot_number}` : 'No vehicle currently parked'}
          icon={Car}
          color={activeParking ? 'amber' : 'slate'}
        />
        <StatCard
          title="Available Slots"
          value={stats.availableSlots}
          subtitle="Open for booking now"
          icon={Layers}
          color="green"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          subtitle="Lifetime reservations"
          icon={CalendarCheck}
          color="blue"
        />
        <StatCard
          title="Total Amount Paid"
          value={`₹${stats.totalSpent}`}
          subtitle="All completed sessions"
          icon={CreditCard}
          color="purple"
        />
      </div>

      {/* Active Parking Hero Card */}
      {activeParking ? (
        <Card className="border-[#2E7D32] ring-1 ring-[#2E7D32]/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">Current Active Parking</h3>
                  <Badge variant={activeParking.status}>{activeParking.status}</Badge>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Booking ID: {activeParking.booking_id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Ticket}
                onClick={() => setSelectedTicket(activeParking)}
              >
                View Ticket
              </Button>
              {activeParking.payment_status !== 'Paid' ? (
                <Link to={`/payments?booking=${activeParking.booking_id}`}>
                  <Button size="sm" icon={CreditCard}>
                    Pay Now (₹{activeParking.estimated_amount})
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  icon={LogOut}
                  onClick={() => setExitDialogOpen(true)}
                >
                  Exit Vehicle
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#F7FAF7] p-3 rounded-lg border border-[#DDE5DD]">
              <span className="text-gray-500 font-medium">Assigned Slot</span>
              <p className="text-lg font-bold text-[#2E7D32] mt-0.5">
                {activeParking.slot_number}{' '}
                <span className="text-xs font-normal text-gray-600">(Floor {activeParking.floor})</span>
              </p>
            </div>
            <div className="bg-[#F7FAF7] p-3 rounded-lg border border-[#DDE5DD]">
              <span className="text-gray-500 font-medium">Vehicle</span>
              <p className="text-sm font-bold text-gray-900 mt-0.5 font-mono">{activeParking.vehicle_number}</p>
              <p className="text-gray-500 text-[11px]">{activeParking.vehicle_model}</p>
            </div>
            <div className="bg-[#F7FAF7] p-3 rounded-lg border border-[#DDE5DD]">
              <span className="text-gray-500 font-medium">Entry Time</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{activeParking.entry_time}</p>
              <p className="text-gray-500 text-[11px]">{activeParking.booking_date}</p>
            </div>
            <div className="bg-[#F7FAF7] p-3 rounded-lg border border-[#DDE5DD]">
              <span className="text-gray-500 font-medium">Payment Status</span>
              <p className="text-sm font-bold mt-0.5">
                <Badge variant={activeParking.payment_status || 'Pending'}>
                  {activeParking.payment_status || 'Pending'}
                </Badge>
              </p>
              <p className="text-gray-500 text-[11px]">Est. ₹{activeParking.estimated_amount}</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-[#2E7D32]/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">No vehicle currently parked</h4>
              <p className="text-xs text-gray-500 mt-0.5">Need a parking spot? Find available slots and reserve in seconds.</p>
            </div>
          </div>
          <Link to="/find-parking">
            <Button icon={Search} size="sm">
              Find & Reserve Slot
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/find-parking"
          className="bg-white p-4 rounded-xl border border-[#DDE5DD] hover:border-[#2E7D32] hover:bg-[#F7FAF7] transition-all duration-150 flex flex-col items-center text-center group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-900">Find Parking</span>
          <span className="text-[11px] text-gray-500 mt-0.5">Reserve a slot</span>
        </Link>

        <Link
          to="/vehicles"
          className="bg-white p-4 rounded-xl border border-[#DDE5DD] hover:border-[#2E7D32] hover:bg-[#F7FAF7] transition-all duration-150 flex flex-col items-center text-center group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Car className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-900">My Vehicles</span>
          <span className="text-[11px] text-gray-500 mt-0.5">Manage cars/bikes</span>
        </Link>

        <Link
          to="/bookings"
          className="bg-white p-4 rounded-xl border border-[#DDE5DD] hover:border-[#2E7D32] hover:bg-[#F7FAF7] transition-all duration-150 flex flex-col items-center text-center group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-900">My Bookings</span>
          <span className="text-[11px] text-gray-500 mt-0.5">View passes</span>
        </Link>

        <Link
          to="/history"
          className="bg-white p-4 rounded-xl border border-[#DDE5DD] hover:border-[#2E7D32] hover:bg-[#F7FAF7] transition-all duration-150 flex flex-col items-center text-center group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-900">Parking History</span>
          <span className="text-[11px] text-gray-500 mt-0.5">Past records</span>
        </Link>
      </div>

      {/* Recent Bookings Table */}
      <Card
        title="Recent Bookings"
        subtitle="Last 5 parking transactions"
        action={
          <Link to="/bookings" className="text-xs font-semibold text-[#2E7D32] hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
        bodyClassName="p-0"
      >
        {recentBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No bookings found yet. Reserve your first parking slot!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Booking ID</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Slot</th>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-gray-900">{b.booking_id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      {b.vehicle_number} <span className="text-gray-400">({b.vehicle_model})</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#2E7D32]">
                      {b.slot_number} <span className="text-[10px] text-gray-500 font-normal">F{b.floor}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {b.booking_date} &bull; {b.entry_time}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">₹{b.estimated_amount}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={b.status}>{b.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedTicket(b)}
                        className="text-xs font-semibold text-[#2E7D32] hover:underline"
                      >
                        Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Ticket Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Parking Ticket"
        maxWidth="max-w-xl"
      >
        <ParkingTicket
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onProceedToPayment={
            selectedTicket && selectedTicket.payment_status !== 'Paid'
              ? () => {
                  const bId = selectedTicket.booking_id;
                  setSelectedTicket(null);
                  navigate(`/payments?booking=${bId}`);
                }
              : null
          }
        />
      </Modal>

      {/* Exit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        onConfirm={handleRecordExit}
        title="Record Vehicle Exit"
        message={`Confirm exit for vehicle ${activeParking?.vehicle_number} at slot ${activeParking?.slot_number}? This will finalize your parking session and free up the slot.`}
        confirmText="Confirm Exit"
        loading={exiting}
        variant="primary"
      />
    </div>
  );
}
