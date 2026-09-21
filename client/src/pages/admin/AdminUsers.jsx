import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Users, Eye, Search, Car, CalendarCheck } from 'lucide-react';

export default function AdminUsers() {
  const { error } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      error('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.phone.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Registered Users</h2>
          <p className="text-xs text-gray-500 mt-1">Directory of customer and administrator accounts</p>
        </div>
      </div>

      {/* Search Input */}
      <Card bodyClassName="p-4">
        <div className="max-w-md relative">
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 pl-9 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </Card>

      {/* Users Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No users match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User ID</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5 text-center">Vehicles</th>
                  <th className="px-5 py-3.5 text-center">Bookings</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono text-gray-400">#{u.id}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{u.name}</td>
                    <td className="px-5 py-4 text-gray-600">{u.email}</td>
                    <td className="px-5 py-4 font-mono text-gray-600">{u.phone}</td>
                    <td className="px-5 py-4 text-center font-bold text-gray-800">{u.vehicle_count}</td>
                    <td className="px-5 py-4 text-center font-bold text-gray-800">{u.booking_count}</td>
                    <td className="px-5 py-4">
                      <Badge variant={u.role === 'ADMIN' ? 'confirmed' : 'available'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => setSelectedUser(u)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* User Details Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Account Details"
        subtitle={`System ID: #${selectedUser?.id}`}
      >
        {selectedUser && (
          <div className="space-y-4 text-xs">
            <div className="bg-[#F7FAF7] p-4 rounded-xl border border-[#DDE5DD] space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Full Name:</span>
                <span className="font-bold text-gray-900">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Email Address:</span>
                <span className="font-medium text-gray-900">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Phone Number:</span>
                <span className="font-mono text-gray-900">{selectedUser.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">System Role:</span>
                <span className="font-semibold">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Registered On:</span>
                <span className="text-gray-700">{selectedUser.created_at}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-white border border-[#DDE5DD] rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Registered Vehicles</p>
                  <p className="text-base font-bold text-gray-900">{selectedUser.vehicle_count}</p>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#DDE5DD] rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Total Bookings</p>
                  <p className="text-base font-bold text-gray-900">{selectedUser.booking_count}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
