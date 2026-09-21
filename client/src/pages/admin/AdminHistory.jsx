import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { History, Search } from 'lucide-react';

export default function AdminHistory() {
  const { error } = useToast();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const res = await api.get('/admin/history');
        setHistory(res.data.history || []);
      } catch (err) {
        error('Failed to load system history.');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filtered = history.filter((h) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      h.booking_id.toLowerCase().includes(term) ||
      h.customer_name.toLowerCase().includes(term) ||
      h.vehicle_number.toLowerCase().includes(term) ||
      h.slot_number.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">System Parking Archive</h2>
        <p className="text-xs text-gray-500 mt-1">Audit log of all vehicle check-ins, exits, and final settled amounts</p>
      </div>

      <Card bodyClassName="p-4">
        <div className="max-w-md relative">
          <input
            type="text"
            placeholder="Search by Booking ID, customer, plate, or slot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 pl-9 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </Card>

      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading archive...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No history records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Booking ID</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Vehicle</th>
                  <th className="px-5 py-3.5">Slot</th>
                  <th className="px-5 py-3.5">Entry Time</th>
                  <th className="px-5 py-3.5">Exit Time</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Final Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((h) => (
                  <tr key={h.booking_db_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">{h.booking_id}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{h.customer_name}</td>
                    <td className="px-5 py-4 font-mono text-gray-800">{h.vehicle_number}</td>
                    <td className="px-5 py-4 font-bold text-[#2E7D32]">
                      {h.slot_number} <span className="text-[10px] text-gray-500 font-normal">F{h.floor}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {h.actual_entry_time || `${h.booking_date} ${h.entry_time}`}
                    </td>
                    <td className="px-5 py-4 text-gray-700">{h.exit_time || '-'}</td>
                    <td className="px-5 py-4 text-gray-700 font-medium">
                      {h.actual_duration || h.booked_duration} hrs
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">₹{h.amount}</td>
                    <td className="px-5 py-4">
                      <Badge variant={h.booking_status}>{h.booking_status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
