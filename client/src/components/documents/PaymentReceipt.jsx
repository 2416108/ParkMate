import React from 'react';
import { Printer, CheckCircle2, ParkingCircle } from 'lucide-react';
import Button from '../common/Button';

export default function PaymentReceipt({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top action button */}
      <div className="flex items-center justify-between no-print pb-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Confirmation</span>
        <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
          Print / Save Receipt
        </Button>
      </div>

      {/* Printable Area */}
      <div className="printable-area bg-white border border-[#DDE5DD] rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2E7D32] flex items-center justify-center text-white">
              <ParkingCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-none">ParkMate</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Official Payment Receipt</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-3 py-1 rounded-full border border-[#C8E6C9]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              PAID
            </span>
            <p className="text-[11px] font-mono font-bold text-gray-800 mt-1">{receipt.payment_id}</p>
          </div>
        </div>

        {/* Customer & Booking Meta */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-[#F7FAF7] p-3.5 rounded-xl border border-[#DDE5DD]">
          <div>
            <p className="text-gray-500 font-medium">Billed To</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{receipt.customer_name || 'Customer'}</p>
            <p className="text-gray-500">{receipt.customer_email}</p>
            <p className="text-gray-500">{receipt.customer_phone}</p>
          </div>
          <div className="text-right sm:text-left">
            <p className="text-gray-500 font-medium">Booking Reference</p>
            <p className="font-bold text-gray-900 text-sm font-mono mt-0.5">{receipt.booking_id}</p>
            <p className="text-gray-600 mt-1">Vehicle: <span className="font-bold">{receipt.vehicle_number}</span></p>
            <p className="text-gray-600">Slot: <span className="font-bold">{receipt.slot_number} (Floor {receipt.floor})</span></p>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="w-full text-left text-xs mb-6">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
              <th className="py-2">Description</th>
              <th className="py-2 text-center">Rate</th>
              <th className="py-2 text-center">Duration</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3">
                <p className="font-semibold text-gray-900">Parking Space Reservation</p>
                <p className="text-gray-500 text-[11px]">Slot {receipt.slot_number} &bull; {receipt.booking_date} ({receipt.entry_time} to {receipt.expected_exit_time})</p>
              </td>
              <td className="py-3 text-center text-gray-700">₹{receipt.hourly_rate || 30}/hr</td>
              <td className="py-3 text-center text-gray-700">{receipt.duration || 1} hrs</td>
              <td className="py-3 text-right font-semibold text-gray-900">₹{receipt.amount}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-3 space-y-1.5 text-xs mb-6">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span className="font-medium">₹{receipt.amount}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Taxes & Parking Cess (0%):</span>
            <span className="font-medium">₹0.00</span>
          </div>
          <div className="flex justify-between text-base font-bold text-[#2E7D32] pt-2 border-t border-gray-100">
            <span>Total Paid:</span>
            <span>₹{receipt.amount}</span>
          </div>
        </div>

        {/* Payment Meta */}
        <div className="bg-[#F7FAF7] rounded-xl p-3 border border-[#DDE5DD] flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-500 font-medium">Payment Mode: </span>
            <span className="font-semibold text-gray-900">{receipt.payment_method || 'UPI'}</span>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Transaction Date: </span>
            <span className="font-semibold text-gray-900">{receipt.payment_date ? receipt.payment_date.split('T')[0] : 'Today'}</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          Thank you for parking with ParkMate! Keep this receipt for your records.
        </p>
      </div>
    </div>
  );
}
