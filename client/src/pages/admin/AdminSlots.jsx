import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import SlotGrid from '../../components/parking/SlotGrid';
import { Layers, Plus, Edit2, Wrench, Search, LayoutGrid, List } from 'lucide-react';

export default function AdminSlots() {
  const { success, error } = useToast();

  const [slots, setSlots] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // View Mode: Table vs Visual Floor Grid
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Add / Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentSlotId, setCurrentSlotId] = useState(null);
  const [formData, setFormData] = useState({
    slot_number: '',
    floor: 1,
    section: 'A',
    vehicle_type: 'Car',
    hourly_rate: 30,
    status: 'Available'
  });
  const [saving, setSaving] = useState(false);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const params = {};
      if (floorFilter) params.floor = floorFilter;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.vehicle_type = typeFilter;

      const res = await api.get('/parking-slots', { params });
      setSlots(res.data.slots || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      error('Failed to load parking slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [floorFilter, statusFilter, typeFilter]);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentSlotId(null);
    setFormData({
      slot_number: '',
      floor: 1,
      section: 'A',
      vehicle_type: 'Car',
      hourly_rate: 30,
      status: 'Available'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (slot) => {
    setModalMode('edit');
    setCurrentSlotId(slot.id);
    setFormData({
      slot_number: slot.slot_number,
      floor: slot.floor,
      section: slot.section,
      vehicle_type: slot.vehicle_type,
      hourly_rate: slot.hourly_rate,
      status: slot.status
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'add') {
        const res = await api.post('/parking-slots', formData);
        success(res.data.message || 'Slot created successfully.');
      } else {
        const res = await api.put(`/parking-slots/${currentSlotId}`, formData);
        success(res.data.message || 'Slot updated successfully.');
      }
      setIsModalOpen(false);
      fetchSlots();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save slot.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async (slot) => {
    try {
      const res = await api.patch(`/parking-slots/${slot.id}/maintenance`);
      success(res.data.message);
      fetchSlots();
    } catch (err) {
      error(err.response?.data?.message || 'Action failed.');
    }
  };

  // Filter slots by search input on client
  const displayedSlots = slots.filter((s) => {
    if (!search.trim()) return true;
    return s.slot_number.toLowerCase().includes(search.toLowerCase().trim());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Parking Slot Management</h2>
          <p className="text-xs text-gray-500 mt-1">Configure layout, floor sections, hourly rates, and maintenance</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-white border border-[#DDE5DD] rounded-lg p-1 flex items-center">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-[#E8F5E9] text-[#2E7D32] font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-[#E8F5E9] text-[#2E7D32] font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Floor Grid</span>
            </button>
          </div>

          <Button icon={Plus} onClick={openAddModal}>
            Add Slot
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Search Slot Number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. A05, B01..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 uppercase placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Floor Filter
            </label>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            >
              <option value="">All Floors</option>
              <option value="1">Floor 1 (Section A)</option>
              <option value="2">Floor 2 (Section B)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Vehicle Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            >
              <option value="">All Vehicle Types</option>
              <option value="Car">Car</option>
              <option value="Bike">Bike</option>
              <option value="SUV">SUV</option>
              <option value="Van">Van</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Content: Table or Grid */}
      {viewMode === 'grid' ? (
        <Card title="Interactive Floor Map" subtitle="Live view of parking slots">
          <SlotGrid
            slots={displayedSlots}
            selectable={false}
          />
        </Card>
      ) : (
        <Card bodyClassName="p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Loading slots...</div>
          ) : displayedSlots.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">No parking slots found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Slot ID</th>
                    <th className="px-5 py-3.5">Slot No.</th>
                    <th className="px-5 py-3.5">Floor & Section</th>
                    <th className="px-5 py-3.5">Vehicle Type</th>
                    <th className="px-5 py-3.5">Hourly Rate</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedSlots.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono text-gray-400">#{s.id}</td>
                      <td className="px-5 py-4 font-bold text-gray-900 text-sm">{s.slot_number}</td>
                      <td className="px-5 py-4 text-gray-700">Floor {s.floor} &bull; Sec {s.section}</td>
                      <td className="px-5 py-4">
                        <Badge>{s.vehicle_type}</Badge>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">₹{s.hourly_rate}/hr</td>
                      <td className="px-5 py-4">
                        <Badge variant={s.status}>{s.status}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit2}
                            onClick={() => openEditModal(s)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={s.status === 'Maintenance' ? 'secondary' : 'outline'}
                            size="sm"
                            icon={Wrench}
                            disabled={s.status === 'Occupied' || s.status === 'Reserved'}
                            onClick={() => handleToggleMaintenance(s)}
                            title={
                              s.status === 'Occupied' || s.status === 'Reserved'
                                ? 'Cannot toggle maintenance on active slot'
                                : 'Toggle maintenance status'
                            }
                          >
                            {s.status === 'Maintenance' ? 'Re-enable' : 'Maintenance'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Add / Edit Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Add New Parking Slot' : `Edit Slot ${formData.slot_number}`}
        subtitle="Manage slot parameters and allocation"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Slot Number"
            placeholder="e.g. A11, B11..."
            value={formData.slot_number}
            onChange={(e) => setFormData({ ...formData, slot_number: e.target.value.toUpperCase() })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Floor"
              value={String(formData.floor)}
              onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value, 10) })}
              options={[
                { value: '1', label: 'Floor 1' },
                { value: '2', label: 'Floor 2' }
              ]}
              required
            />
            <Input
              label="Section"
              placeholder="e.g. A or B"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Vehicle Type"
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
              options={[
                { value: 'All', label: 'All Vehicles' },
                { value: 'Car', label: 'Car' },
                { value: 'Bike', label: 'Bike' },
                { value: 'SUV', label: 'SUV' },
                { value: 'Van', label: 'Van' }
              ]}
              required
            />
            <Input
              label="Hourly Rate (₹)"
              type="number"
              value={String(formData.hourly_rate)}
              onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          {modalMode === 'edit' && (
            <Select
              label="Slot Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'Available', label: 'Available' },
                { value: 'Maintenance', label: 'Maintenance' },
                { value: 'Reserved', label: 'Reserved' },
                { value: 'Occupied', label: 'Occupied' }
              ]}
              required
            />
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {modalMode === 'add' ? 'Create Slot' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
