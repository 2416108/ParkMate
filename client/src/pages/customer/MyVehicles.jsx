import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import { Car, Bike, Truck, Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';

const VEHICLE_TYPES = [
  { value: 'Car', label: 'Car' },
  { value: 'Bike', label: 'Bike' },
  { value: 'SUV', label: 'SUV' },
  { value: 'Van', label: 'Van' }
];

export default function MyVehicles() {
  const { success, error } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'Car',
    model: '',
    color: ''
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicles');
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      error('Failed to load registered vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentId(null);
    setFormData({
      vehicle_number: '',
      vehicle_type: 'Car',
      model: '',
      color: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (v) => {
    setModalMode('edit');
    setCurrentId(v.id);
    setFormData({
      vehicle_number: v.vehicle_number,
      vehicle_type: v.vehicle_type,
      model: v.model,
      color: v.color
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.vehicle_number.trim() || !formData.model.trim() || !formData.color.trim()) {
      setFormError('All fields are required.');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'add') {
        const res = await api.post('/vehicles', formData);
        success(res.data.message || 'Vehicle registered successfully.');
      } else {
        const res = await api.put(`/vehicles/${currentId}`, formData);
        success(res.data.message || 'Vehicle details updated successfully.');
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save vehicle.';
      setFormError(msg);
      error(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (v) => {
    setVehicleToDelete(v);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/vehicles/${vehicleToDelete.id}`);
      success(res.data.message || 'Vehicle deleted successfully.');
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
      fetchVehicles();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete vehicle.');
    } finally {
      setDeleting(false);
    }
  };

  const getVehicleIcon = (type) => {
    if (type === 'Bike') return <Bike className="w-5 h-5 text-[#2E7D32]" />;
    if (type === 'Van' || type === 'SUV') return <Truck className="w-5 h-5 text-[#2E7D32]" />;
    return <Car className="w-5 h-5 text-[#2E7D32]" />;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">My Registered Vehicles</h2>
          <p className="text-xs text-gray-500 mt-1">Manage all your vehicles linked to your parking account</p>
        </div>
        <Button icon={Plus} onClick={openAddModal}>
          Add New Vehicle
        </Button>
      </div>

      {/* Vehicles List / Cards */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 text-sm">Loading vehicles...</div>
      ) : vehicles.length === 0 ? (
        <Card className="text-center p-12">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mb-3">
            <Car className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No vehicles registered yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            Add your car, bike, or SUV to start booking parking spots across all floors.
          </p>
          <Button icon={Plus} onClick={openAddModal}>
            Add Vehicle Now
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-xl border border-[#DDE5DD] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center">
                      {getVehicleIcon(v.vehicle_type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-base font-mono text-gray-900">{v.vehicle_number}</h4>
                      <p className="text-xs text-gray-500">{v.model}</p>
                    </div>
                  </div>
                  <Badge>{v.vehicle_type}</Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Color</span>
                    <p className="font-semibold text-gray-800">{v.color}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Active Bookings</span>
                    <p className="font-semibold text-gray-800">
                      {v.active_bookings_count > 0 ? (
                        <span className="text-amber-600 font-bold">{v.active_bookings_count} Active</span>
                      ) : (
                        'None'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit2}
                  onClick={() => openEditModal(v)}
                >
                  Edit
                </Button>
                <Button
                  variant="dangerOutline"
                  size="sm"
                  icon={Trash2}
                  onClick={() => confirmDelete(v)}
                  disabled={v.active_bookings_count > 0}
                  title={v.active_bookings_count > 0 ? 'Cannot delete vehicle with active booking' : 'Delete vehicle'}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Register New Vehicle' : 'Edit Vehicle Details'}
        subtitle="Enter vehicle details according to official license registration"
      >
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="License Plate Number"
            placeholder="e.g. TN01AB1234"
            value={formData.vehicle_number}
            onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
            helperText="Standard uppercase alphanumeric plate format (e.g. TN01AB1234)"
            required
          />

          <Select
            label="Vehicle Type"
            value={formData.vehicle_type}
            onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
            options={VEHICLE_TYPES}
            required
          />

          <Input
            label="Vehicle Model"
            placeholder="e.g. Hyundai i20, Honda Activa"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            required
          />

          <Input
            label="Color"
            placeholder="e.g. White, Black, Silver"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            required
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {modalMode === 'add' ? 'Add Vehicle' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete vehicle ${vehicleToDelete?.vehicle_number} (${vehicleToDelete?.model})? This action cannot be undone.`}
        confirmText="Delete Vehicle"
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
