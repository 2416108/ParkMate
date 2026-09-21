import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { Car, Bike, Truck, Search } from 'lucide-react';

export default function AdminVehicles() {
  const { error } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadVehicles() {
      try {
        setLoading(true);
        const res = await api.get('/admin/vehicles');
        setVehicles(res.data.vehicles || []);
      } catch (err) {
        error('Failed to load registered vehicles.');
      } finally {
        setLoading(false);
      }
    }
    loadVehicles();
  }, []);

  const filtered = vehicles.filter((v) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      v.vehicle_number.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      (v.owner_name && v.owner_name.toLowerCase().includes(term))
    );
  });

  const getVehicleIcon = (type) => {
    if (type === 'Bike') return <Bike className="w-4 h-4 text-[#2E7D32]" />;
    if (type === 'Van' || type === 'SUV') return <Truck className="w-4 h-4 text-[#2E7D32]" />;
    return <Car className="w-4 h-4 text-[#2E7D32]" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">System Vehicles Directory</h2>
        <p className="text-xs text-gray-500 mt-1">All vehicles registered across customer accounts</p>
      </div>

      <Card bodyClassName="p-4">
        <div className="max-w-md relative">
          <input
            type="text"
            placeholder="Search by license plate, model, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 pl-9 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </Card>

      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading vehicles...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No vehicles match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Plate Number</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Model</th>
                  <th className="px-5 py-3.5">Color</th>
                  <th className="px-5 py-3.5">Owner Name</th>
                  <th className="px-5 py-3.5">Owner Contact</th>
                  <th className="px-5 py-3.5">Added Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        {getVehicleIcon(v.vehicle_type)}
                        <span>{v.vehicle_number}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge>{v.vehicle_type}</Badge>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">{v.model}</td>
                    <td className="px-5 py-4 text-gray-700">{v.color}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{v.owner_name}</td>
                    <td className="px-5 py-4 text-gray-500">
                      <div>{v.owner_email}</div>
                      <div className="font-mono text-[11px] text-gray-400">{v.owner_phone}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {v.created_at ? v.created_at.split('T')[0] : 'Standard'}
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
