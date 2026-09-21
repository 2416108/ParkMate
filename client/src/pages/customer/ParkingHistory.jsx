import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PaymentReceipt from '../../components/documents/PaymentReceipt';
import { History, Filter, Search, FileText } from 'lucide-react';

export default function ParkingHistory() {
  const { error } = useToast();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (vehicleSearch) params.vehicle = vehicleSearch;
      if (dateFilter) params.date = dateFilter;

      const res = await api.get('/parking/history', { params });
      setHistory(res.data.history || []);
    } catch (err) {
      error('Failed to load parking history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleOpenReceipt = (item) => {
    // Construct receipt object from history item
    const receiptObj = {
      payment_id: item.payment_id || `REC-${item.booking_id}`,
      booking_id: item.booking_id,
      customer_name: 'Customer',
      vehicle_number: item.vehicle_number,
      vehicle_type: item.vehicle_type,
      slot_number: item.slot_number,
      floor: item.floor,
      booking_date: item.booking_date,
      entry_time: item.entry_time,
      expected_exit_time: item.expected_exit_time,
      duration: item.actual_duration || item.booked_duration,
      hourly_rate: item.hourly_rate,
      amount: item.amount,
      payment_method: item.payment_method || 'UPI',
      payment_date: item.booking_date
    };
    setSelectedReceipt(receiptObj);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Parking History</h2>
        <p className="text-xs text-gray-500 mt-1">
          Complete archive of all your finalized and cancelled parking sessions
        </p>
      </div>

      {/* Filters Bar */}
      <Card bodyClassName="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Search Vehicle
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. TN01AB1234"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 uppercase placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            >
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Active">Active / In Progress</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Filter Date
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

      {/* History Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading parking history...</div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No parking history records found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Booking ID</th>
                  <th className="px-5 py-3.5">Vehicle</th>
                  <th className="px-5 py-3.5">Slot</th>
                  <th className="px-5 py-3.5">Entry Time</th>
                  <th className="px-5 py-3.5">Exit Time</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Final Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((h) => (
                  <tr key={h.booking_db_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">{h.booking_id}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono font-medium text-gray-900">{h.vehicle_number}</span>
                      <p className="text-[11px] text-gray-500">{h.vehicle_model}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-[#2E7D32]">
                      {h.slot_number}{' '}
                      <span className="text-[11px] font-normal text-gray-500">(F{h.floor})</span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      <div>{h.actual_entry_time || `${h.booking_date} ${h.entry_time}`}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      <div>{h.exit_time || '-'}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-700 font-medium">
                      {h.actual_duration || h.booked_duration} hrs
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">₹{h.amount}</td>
                    <td className="px-5 py-4">
                      <Badge variant={h.booking_status}>{h.booking_status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {h.booking_status === 'Completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={FileText}
                          onClick={() => handleOpenReceipt(h)}
                        >
                          Receipt
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Receipt Modal */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Parking Receipt"
        maxWidth="max-w-xl"
      >
        <PaymentReceipt
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      </Modal>
    </div>
  );
}
