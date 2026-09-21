import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ParkingTicket from '../../components/documents/ParkingTicket';
import { Ticket, CreditCard, XCircle, LogOut, Search } from 'lucide-react';

export default function MyBookings() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Exit dialog
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [bookingToExit, setBookingToExit] = useState(null);
  const [exiting, setExiting] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    try {
      const res = await api.put(`/bookings/${bookingToCancel.id}/cancel`);
      success(res.data.message || 'Booking cancelled and slot released.');
      setCancelDialogOpen(false);
      setBookingToCancel(null);
      fetchBookings();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  const handleRecordExit = async () => {
    if (!bookingToExit) return;
    setExiting(true);
    try {
      const res = await api.post('/parking/exit', { booking_id: bookingToExit.booking_id });
      success(res.data.message || 'Vehicle exit recorded! Slot released.');
      setExitDialogOpen(false);
      setBookingToExit(null);
      fetchBookings();
      navigate('/history');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record exit.');
    } finally {
      setExiting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">My Bookings & Tickets</h2>
          <p className="text-xs text-gray-500 mt-1">Review your reservations, download tickets, or settle payments</p>
        </div>
        <Button icon={Search} onClick={() => navigate('/find-parking')}>
          Book New Slot
        </Button>
      </div>

      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No bookings found. You haven't made any parking reservations yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Booking ID</th>
                  <th className="px-5 py-3.5">Vehicle</th>
                  <th className="px-5 py-3.5">Slot</th>
                  <th className="px-5 py-3.5">Date & Entry</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">{b.booking_id}</td>
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
                    <td className="px-5 py-4 text-gray-700">{b.duration} hrs</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">₹{b.estimated_amount}</td>
                    <td className="px-5 py-4">
                      <Badge variant={b.status}>{b.status}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={b.payment_status || 'Pending'}>
                        {b.payment_status || 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Ticket}
                          onClick={() => setSelectedTicket(b)}
                          title="View Parking Pass"
                        >
                          Ticket
                        </Button>

                        {b.payment_status !== 'Paid' && b.status !== 'Cancelled' && (
                          <Button
                            size="sm"
                            icon={CreditCard}
                            onClick={() => navigate(`/payments?booking=${b.booking_id}`)}
                          >
                            Pay
                          </Button>
                        )}

                        {b.status === 'Active' && (
                          <Button
                            variant="dangerOutline"
                            size="sm"
                            icon={LogOut}
                            onClick={() => {
                              setBookingToExit(b);
                              setExitDialogOpen(true);
                            }}
                          >
                            Exit
                          </Button>
                        )}

                        {b.status === 'Confirmed' && b.payment_status !== 'Paid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            icon={XCircle}
                            onClick={() => {
                              setBookingToCancel(b);
                              setCancelDialogOpen(true);
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
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
        title="Parking Pass / Ticket"
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

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Parking Booking"
        message={`Are you sure you want to cancel booking ${bookingToCancel?.booking_id}? The reserved slot (${bookingToCancel?.slot_number}) will be released immediately.`}
        confirmText="Cancel Reservation"
        loading={cancelling}
        variant="danger"
      />

      {/* Exit Confirmation */}
      <ConfirmDialog
        isOpen={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        onConfirm={handleRecordExit}
        title="Record Vehicle Exit"
        message={`Are you sure you want to record vehicle exit for ${bookingToExit?.vehicle_number} at slot ${bookingToExit?.slot_number}?`}
        confirmText="Confirm Exit"
        loading={exiting}
        variant="primary"
      />
    </div>
  );
}
