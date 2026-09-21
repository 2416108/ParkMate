import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import PaymentReceipt from '../../components/documents/PaymentReceipt';
import { CreditCard, QrCode, Banknote, CheckCircle, FileText, ArrowRight } from 'lucide-react';

export default function Payments() {
  const [searchParams] = useSearchParams();
  const targetBookingId = searchParams.get('booking');

  const { success, error } = useToast();

  const [pendingBookings, setPendingBookings] = useState([]);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Payment Simulation State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('customer@upi');
  const [processing, setProcessing] = useState(false);

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, paymentsRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/payments')
      ]);

      const allBookings = bookingsRes.data.bookings || [];
      const pending = allBookings.filter(b => b.payment_status !== 'Paid' && b.status !== 'Cancelled');
      setPendingBookings(pending);

      setPaymentsHistory(paymentsRes.data.payments || []);

      // If URL param provided, auto-select that booking for payment
      if (targetBookingId) {
        const found = allBookings.find(b => b.booking_id === targetBookingId);
        if (found) {
          setSelectedBooking(found);
        }
      } else if (pending.length > 0 && !selectedBooking) {
        setSelectedBooking(pending[0]);
      }
    } catch (err) {
      error('Failed to load payments or bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetBookingId]);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedBooking) {
      error('Please select a booking to pay for.');
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post('/payments', {
        booking_id: selectedBooking.booking_id,
        payment_method: paymentMethod
      });

      success(res.data.message || 'Payment completed successfully! Receipt generated.');
      setViewingReceipt(res.data.receipt);
      setSelectedBooking(null);
      loadData();
    } catch (err) {
      error(err.response?.data?.message || 'Payment failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewReceipt = async (payment) => {
    try {
      const res = await api.get(`/payments/${payment.id}`);
      setViewingReceipt(res.data.receipt);
    } catch (err) {
      error('Failed to retrieve receipt.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Payments & Billing</h2>
        <p className="text-xs text-gray-500 mt-1">
          Simulate parking fee checkout (UPI, Card, Cash) and view official tax receipts
        </p>
      </div>

      {/* Payment Checkout Section */}
      {pendingBookings.length > 0 && selectedBooking ? (
        <Card title="Pending Parking Bill" subtitle="Complete payment to validate entry & occupancy">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Bill Breakdown (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Select which booking to pay for if multiple */}
              {pendingBookings.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Pay for:</span>
                  {pendingBookings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBooking(b)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        selectedBooking.id === b.id
                          ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]'
                          : 'bg-white border-[#DDE5DD] text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {b.booking_id}
                    </button>
                  ))}
                </div>
              )}

              {/* Itemized summary table */}
              <div className="bg-[#F7FAF7] rounded-xl p-4 border border-[#DDE5DD] text-xs space-y-3">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
                  <span className="text-gray-500">Booking Reference</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">{selectedBooking.booking_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vehicle</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {selectedBooking.vehicle_number} ({selectedBooking.vehicle_model})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Assigned Slot</span>
                  <span className="font-bold text-[#2E7D32] text-sm">
                    {selectedBooking.slot_number} (Floor {selectedBooking.floor})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Entry & Expected Exit</span>
                  <span className="text-gray-800">
                    {selectedBooking.entry_time} &rarr; {selectedBooking.expected_exit_time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="text-gray-800">{selectedBooking.duration} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hourly Rate</span>
                  <span className="text-gray-800">₹{selectedBooking.hourly_rate} / hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-800 font-medium">₹{selectedBooking.estimated_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Additional Surcharge</span>
                  <span className="text-gray-800">₹0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-sm font-bold">
                  <span className="text-gray-900">Total Payable:</span>
                  <span className="text-xl text-[#2E7D32]">₹{selectedBooking.estimated_amount}</span>
                </div>
              </div>
            </div>

            {/* Right: Payment Method Selector (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Select Payment Method:
                </p>

                <div className="space-y-2">
                  {/* UPI */}
                  <label
                    onClick={() => setPaymentMethod('UPI')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'UPI'
                        ? 'border-[#2E7D32] bg-[#E8F5E9]/50 ring-1 ring-[#2E7D32]'
                        : 'border-[#DDE5DD] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">UPI / QR Code</p>
                        <p className="text-[11px] text-gray-500">Google Pay, PhonePe, Paytm</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                      className="text-[#2E7D32] focus:ring-[#2E7D32]"
                    />
                  </label>

                  {/* Card */}
                  <label
                    onClick={() => setPaymentMethod('Credit/Debit Card')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'Credit/Debit Card'
                        ? 'border-[#2E7D32] bg-[#E8F5E9]/50 ring-1 ring-[#2E7D32]'
                        : 'border-[#DDE5DD] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Credit / Debit Card</p>
                        <p className="text-[11px] text-gray-500">Visa, Mastercard, RuPay</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'Credit/Debit Card'}
                      onChange={() => setPaymentMethod('Credit/Debit Card')}
                      className="text-[#2E7D32] focus:ring-[#2E7D32]"
                    />
                  </label>

                  {/* Cash */}
                  <label
                    onClick={() => setPaymentMethod('Cash')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'Cash'
                        ? 'border-[#2E7D32] bg-[#E8F5E9]/50 ring-1 ring-[#2E7D32]'
                        : 'border-[#DDE5DD] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Cash Payment</p>
                        <p className="text-[11px] text-gray-500">Pay at parking barrier counter</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'Cash'}
                      onChange={() => setPaymentMethod('Cash')}
                      className="text-[#2E7D32] focus:ring-[#2E7D32]"
                    />
                  </label>
                </div>
              </div>

              {/* Payment Note */}
              <div className="p-3 bg-green-50/50 border border-green-200 rounded-lg text-[11px] text-green-900">
                Digital Settlement: Complete payment to confirm parking occupancy and generate your official receipt.
              </div>

              <Button
                onClick={handleProcessPayment}
                loading={processing}
                className="w-full"
                size="lg"
              >
                Pay ₹{selectedBooking.estimated_amount} Now
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Payment Transactions Table */}
      <Card title="Payment Receipts & Transactions" subtitle="History of all settled parking invoices" bodyClassName="p-0">
        {paymentsHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No payment records found yet. Complete a booking checkout to view receipts here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Payment ID</th>
                  <th className="px-5 py-3.5">Booking ID</th>
                  <th className="px-5 py-3.5">Vehicle</th>
                  <th className="px-5 py-3.5">Slot</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentsHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900">{p.payment_id}</td>
                    <td className="px-5 py-3.5 font-mono text-gray-700">{p.booking_id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 font-mono">{p.vehicle_number}</td>
                    <td className="px-5 py-3.5 font-bold text-[#2E7D32]">{p.slot_number}</td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">₹{p.amount}</td>
                    <td className="px-5 py-3.5 text-gray-700">{p.payment_method}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="Paid">Paid</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={FileText}
                        onClick={() => handleViewReceipt(p)}
                      >
                        Receipt
                      </Button>
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
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        title="Official Payment Receipt"
        maxWidth="max-w-xl"
      >
        <PaymentReceipt
          receipt={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      </Modal>
    </div>
  );
}
