import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  Layers,
  CheckCircle2,
  Clock,
  Car,
  Users,
  IndianRupee,
  ArrowRight,
  ShieldAlert,
  Wrench
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.get('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-gray-500 text-sm">Loading admin dashboard overview...</div>;
  }

  const { stats, currentParkings, recentBookings } = data;

  // Calculate percentages for occupancy breakdown
  const total = stats.totalSlots || 1;
  const availPct = Math.round((stats.availableSlots / total) * 100);
  const resPct = Math.round((stats.reservedSlots / total) * 100);
  const occPct = Math.round((stats.occupiedSlots / total) * 100);
  const maintPct = Math.round((stats.maintenanceSlots / total) * 100);

  return (
    <div className="space-y-6">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h2>
          <p className="text-xs text-gray-500 mt-1">Facility occupancy, bookings, and revenue overview</p>
        </div>
        <Link to="/admin/slots">
          <Button icon={Layers} size="sm">
            Manage Slots
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Slots"
          value={stats.totalSlots}
          subtitle="Capacity across 2 floors"
          icon={Layers}
          color="slate"
        />
        <StatCard
          title="Available Slots"
          value={stats.availableSlots}
          subtitle={`${availPct}% available`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Occupied Slots"
          value={stats.occupiedSlots}
          subtitle="Vehicles parked"
          icon={Car}
          color="red"
        />
        <StatCard
          title="Reserved Slots"
          value={stats.reservedSlots}
          subtitle="Awaiting entry"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Registered Users"
          value={stats.totalUsers}
          subtitle={`${stats.totalVehicles} registered vehicles`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue}`}
          subtitle={`Total: ₹${stats.totalRevenue}`}
          icon={IndianRupee}
          color="green"
        />
      </div>

      {/* Visual Occupancy Breakdown Bar */}
      <Card title="Facility Occupancy Distribution" subtitle="Live slot status composition">
        <div className="space-y-4">
          {/* Multi-segment Progress Bar */}
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${availPct}%` }}
              className="bg-[#2E7D32] transition-all duration-500"
              title={`Available: ${stats.availableSlots} (${availPct}%)`}
            />
            <div
              style={{ width: `${resPct}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`Reserved: ${stats.reservedSlots} (${resPct}%)`}
            />
            <div
              style={{ width: `${occPct}%` }}
              className="bg-red-500 transition-all duration-500"
              title={`Occupied: ${stats.occupiedSlots} (${occPct}%)`}
            />
            <div
              style={{ width: `${maintPct}%` }}
              className="bg-slate-400 transition-all duration-500"
              title={`Maintenance: ${stats.maintenanceSlots} (${maintPct}%)`}
            />
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-[#C8E6C9] bg-[#E8F5E9]/50 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Available:</span>
              <span className="font-bold text-[#2E7D32] text-sm">{stats.availableSlots} ({availPct}%)</span>
            </div>
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Reserved:</span>
              <span className="font-bold text-amber-700 text-sm">{stats.reservedSlots} ({resPct}%)</span>
            </div>
            <div className="p-3 rounded-lg border border-red-200 bg-red-50/50 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Occupied:</span>
              <span className="font-bold text-red-700 text-sm">{stats.occupiedSlots} ({occPct}%)</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Maintenance:</span>
              <span className="font-bold text-slate-700 text-sm">{stats.maintenanceSlots} ({maintPct}%)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Section: Currently Parked & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currently Parked Vehicles */}
        <Card
          title="Current Active Parking Sessions"
          subtitle={`${currentParkings.length} vehicle(s) parked or reserved`}
          bodyClassName="p-0"
        >
          {currentParkings.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              No vehicles currently parked in the facility.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Entry Time</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentParkings.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-[#2E7D32]">
                        {p.slot_number}{' '}
                        <span className="text-[10px] text-gray-500 font-normal">F{p.floor}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-gray-900">{p.vehicle_number}</td>
                      <td className="px-4 py-3 text-gray-700">{p.customer_name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.entry_time}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent System Bookings */}
        <Card
          title="Recent System Bookings"
          subtitle="Last 10 reservations"
          action={
            <Link to="/admin/bookings" className="text-xs font-semibold text-[#2E7D32] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
          bodyClassName="p-0"
        >
          {recentBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">No bookings recorded yet.</div>
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Booking ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">{b.booking_id}</td>
                      <td className="px-4 py-3 text-gray-800">{b.customer_name}</td>
                      <td className="px-4 py-3 font-bold text-[#2E7D32]">{b.slot_number}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">₹{b.estimated_amount}</td>
                      <td className="px-4 py-3">
                        <Badge variant={b.status}>{b.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
