import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import SlotGrid from '../../components/parking/SlotGrid';
import Modal from '../../components/common/Modal';
import ParkingTicket from '../../components/documents/ParkingTicket';
import { Car, Clock, Calendar, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function FindParking() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState('10:00 AM');
  const [duration, setDuration] = useState('3');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Confirmation & Ticket Modal States
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [vehRes, slotRes] = await Promise.all([
          api.get('/vehicles'),
          api.get('/parking-slots')
        ]);

        const userVehicles = vehRes.data.vehicles || [];
        setVehicles(userVehicles);
        if (userVehicles.length > 0) {
          setSelectedVehicleId(String(userVehicles[0].id));
        }

        setSlots(slotRes.data.slots || []);
      } catch (err) {
        error('Failed to load parking slots or vehicles.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedVehicle = vehicles.find(v => String(v.id) === String(selectedVehicleId));
  const hourlyRate = selectedSlot?.hourly_rate || 30;
  const estimatedTotal = parseInt(duration || 1, 10) * hourlyRate;

  const handleOpenSummary = (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      error('Please select a vehicle first.');
      return;
    }
    if (!selectedSlot) {
      error('Please click on an Available parking slot from the grid below.');
      return;
    }
    setSummaryModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    setBookingLoading(true);
    try {
      const res = await api.post('/bookings', {
        vehicle_id: parseInt(selectedVehicleId, 10),
        slot_id: selectedSlot.id,
        booking_date: bookingDate,
        entry_time: entryTime,
        duration: parseInt(duration, 10)
      });

      success('Parking slot booked successfully! Ticket generated.');
      setSummaryModalOpen(false);
      setGeneratedTicket(res.data.booking);

      // Refresh slots
      const slotRes = await api.get('/parking-slots');
      setSlots(slotRes.data.slots || []);
      setSelectedSlot(null);
    } catch (err) {
      error(err.response?.data?.message || 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Find & Reserve Parking</h2>
        <p className="text-xs text-gray-500 mt-1">
          Select your vehicle, parking duration, and pick an available slot from the floor map
        </p>
      </div>

      {/* Step 1: Booking Preferences Form */}
      <Card title="1. Select Booking Details" subtitle="Specify your vehicle and estimated parking period">
        {vehicles.length === 0 && !loading ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>You don't have any registered vehicles yet. Please add a vehicle before booking.</span>
            </div>
            <Button size="sm" onClick={() => navigate('/vehicles')}>
              + Add Vehicle
            </Button>
          </div>
        ) : (
          <form onSubmit={handleOpenSummary} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Select Vehicle"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              options={vehicles.map(v => ({
                value: String(v.id),
                label: `${v.vehicle_number} (${v.model} - ${v.vehicle_type})`
              }))}
              required
            />

            <Input
              label="Booking Date"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />

            <Select
              label="Entry Time"
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value)}
              options={[
                '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
                '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
                '06:00 PM', '07:00 PM', '08:00 PM'
              ]}
              required
            />

            <Select
              label="Duration (Hours)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              options={[
                { value: '1', label: '1 Hour' },
                { value: '2', label: '2 Hours' },
                { value: '3', label: '3 Hours (Recommended)' },
                { value: '4', label: '4 Hours' },
                { value: '5', label: '5 Hours' },
                { value: '6', label: '6 Hours' },
                { value: '8', label: '8 Hours' },
                { value: '12', label: '12 Hours (Half Day)' },
                { value: '24', label: '24 Hours (Full Day)' }
              ]}
              required
            />
          </form>
        )}
      </Card>

      {/* Step 2: Interactive Slot Grid */}
      <Card
        title="2. Choose an Available Parking Slot"
        subtitle="Click any green 'Available' slot to select it"
        action={
          selectedSlot ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 hidden sm:inline">
                Selected: <strong className="text-[#2E7D32]">{selectedSlot.slot_number}</strong> (₹{estimatedTotal})
              </span>
              <Button size="sm" onClick={handleOpenSummary}>
                Confirm Selection
              </Button>
            </div>
          ) : null
        }
      >
        <SlotGrid
          slots={slots}
          selectedSlot={selectedSlot}
          onSelectSlot={(slot) => setSelectedSlot(slot)}
        />
      </Card>

      {/* Selected Slot Floating Bottom Summary Bar (if slot selected) */}
      {selectedSlot && (
        <div className="sticky bottom-4 z-20 bg-white border-2 border-[#2E7D32] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold text-lg">
              {selectedSlot.slot_number}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Floor {selectedSlot.floor} &bull; Section {selectedSlot.section} &bull; Rate: ₹{selectedSlot.hourly_rate}/hr
              </p>
              <h4 className="text-sm font-bold text-gray-900">
                Total for {duration} hrs: <span className="text-[#2E7D32] text-base">₹{estimatedTotal}</span>
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSlot(null)}
              className="flex-1 sm:flex-none"
            >
              Change Slot
            </Button>
            <Button
              size="sm"
              icon={ArrowRight}
              onClick={handleOpenSummary}
              className="flex-1 sm:flex-none"
            >
              Review & Book
            </Button>
          </div>
        </div>
      )}

      {/* Booking Summary Modal */}
      <Modal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        title="Confirm Booking Reservation"
        subtitle="Please review the reservation details before confirming"
      >
        <div className="space-y-4">
          <div className="bg-[#F7FAF7] p-4 rounded-xl border border-[#DDE5DD] space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Vehicle:</span>
              <span className="font-bold text-gray-900 font-mono">
                {selectedVehicle?.vehicle_number} ({selectedVehicle?.model})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vehicle Type:</span>
              <span className="font-medium text-gray-900">{selectedVehicle?.vehicle_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Assigned Slot:</span>
              <span className="font-bold text-[#2E7D32] text-sm">
                {selectedSlot?.slot_number} (Floor {selectedSlot?.floor})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date & Entry Time:</span>
              <span className="font-medium text-gray-900">{bookingDate} at {entryTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expected Duration:</span>
              <span className="font-medium text-gray-900">{duration} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hourly Rate:</span>
              <span className="font-medium text-gray-900">₹{selectedSlot?.hourly_rate} / hour</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold">
              <span className="text-gray-900">Estimated Total Amount:</span>
              <span className="text-[#2E7D32]">₹{estimatedTotal}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setSummaryModalOpen(false)}>
              Back
            </Button>
            <Button onClick={handleConfirmBooking} loading={bookingLoading}>
              Confirm Booking
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generated Ticket Modal */}
      <Modal
        isOpen={!!generatedTicket}
        onClose={() => setGeneratedTicket(null)}
        title="Parking Ticket"
        maxWidth="max-w-xl"
      >
        <ParkingTicket
          ticket={generatedTicket}
          onClose={() => setGeneratedTicket(null)}
          onProceedToPayment={() => {
            const bId = generatedTicket?.booking_id;
            setGeneratedTicket(null);
            navigate(`/payments?booking=${bId}`);
          }}
        />
      </Modal>
    </div>
  );
}
