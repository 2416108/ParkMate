import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ParkingTicket from '../../components/documents/ParkingTicket';
import { Search, Eye, Ticket } from 'lucide-react';

export default function AdminBookings() {
  const { error } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await api.get('/admin/bookings', { params });
      setBookings(res.data.bookings || []);
    } catch (err) {
      error('Failed to load system bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">System Bookings Audit</h2>
        <p className="text-xs text-gray-500 mt-1">Audit and monitor all customer parking reservations</p>
      </div>

      {/* Filters Bar */}
      <Card bodyClassName="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Search Reference / Plate
            </label>
            <input
              type="text"
              placeholder="e.g. PKG-2026, TN01..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 uppercase placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Booking Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            >
              <option value="">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Booking Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" size="sm" icon={Search} className="w-full">
              Apply Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Bookings Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No bookings match the search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Booking ID</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Vehicle</th>
                  <th className="px-5 py-3.5">Slot</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5 text-right">Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">{b.booking_id}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{b.customer_name}</p>
                      <p className="text-[11px] text-gray-500">{b.customer_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono font-medium text-gray-900">{b.vehicle_number}</span>
                      <p className="text-[11px] text-gray-500">{b.vehicle_model}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-[#2E7D32]">
                      {b.slot_number}{' '}
                      <span className="text-[11px] font-normal text-gray-500">(F{b.floor})</span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      <div>{b.booking_date}</div>
                      <div className="text-[11px] text-gray-500">{b.entry_time}</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">₹{b.estimated_amount}</td>
                    <td className="px-5 py-4">
                      <Badge variant={b.status}>{b.status}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={b.payment_status || 'Pending'}>
                        {b.payment_status || 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Ticket}
                        onClick={() => setSelectedTicket(b)}
                      >
                        Pass
                      </Button>
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
        title="Parking Ticket Details"
        maxWidth="max-w-xl"
      >
        <ParkingTicket
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      </Modal>
    </div>
  );
}
