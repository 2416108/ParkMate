import React from 'react';
import { Printer, X, ParkingCircle, CheckCircle } from 'lucide-react';
import Button from '../common/Button';

export default function ParkingTicket({ ticket, onClose, onProceedToPayment }) {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action buttons (hidden when printing) */}
      <div className="flex items-center justify-between no-print pb-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Official Parking Pass</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
            Print / Save PDF
          </Button>
          {onProceedToPayment && (
            <Button size="sm" onClick={onProceedToPayment}>
              Proceed to Payment
            </Button>
          )}
        </div>
      </div>

      {/* Printable Ticket Container */}
      <div className="printable-area bg-white border-2 border-dashed border-[#2E7D32] rounded-2xl p-6 shadow-sm">
        {/* Ticket Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2E7D32] flex items-center justify-center text-white">
              <ParkingCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-none">ParkMate</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Parking Management System</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-full border border-[#C8E6C9]">
              <CheckCircle className="w-3.5 h-3.5" />
              {ticket.status || 'Confirmed'}
            </span>
            <p className="text-[11px] font-mono font-bold text-gray-800 mt-1">{ticket.booking_id}</p>
          </div>
        </div>

        {/* Slot & Floor Hero Block */}
        <div className="bg-[#F7FAF7] border border-[#DDE5DD] rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Assigned Slot</p>
            <p className="text-3xl font-black text-[#2E7D32] tracking-tight">{ticket.slot_number}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
            <p className="text-base font-bold text-gray-800">Floor {ticket.floor} &bull; Section {ticket.section || 'A'}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs mb-5">
          <div>
            <p className="text-gray-500 font-medium">Customer Name</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{ticket.customer_name || 'Customer'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Vehicle License Plate</p>
            <p className="font-bold text-gray-900 text-sm font-mono mt-0.5">{ticket.vehicle_number}</p>
          </div>

          <div>
            <p className="text-gray-500 font-medium">Vehicle Type & Model</p>
            <p className="font-semibold text-gray-800 mt-0.5">{ticket.vehicle_type} ({ticket.vehicle_model || 'Standard'})</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Booking Date</p>
            <p className="font-semibold text-gray-800 mt-0.5">{ticket.booking_date}</p>
          </div>

          <div>
            <p className="text-gray-500 font-medium">Entry Time</p>
            <p className="font-semibold text-gray-800 mt-0.5">{ticket.entry_time}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Expected Exit Time</p>
            <p className="font-semibold text-gray-800 mt-0.5">{ticket.expected_exit_time}</p>
          </div>

          <div>
            <p className="text-gray-500 font-medium">Hourly Rate</p>
            <p className="font-semibold text-gray-800 mt-0.5">₹{ticket.hourly_rate || 30} / hr</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Duration & Estimated Amount</p>
            <p className="font-bold text-base text-[#2E7D32] mt-0.5">
              ₹{ticket.estimated_amount} <span className="text-xs font-normal text-gray-600">({ticket.duration} hrs)</span>
            </p>
          </div>
        </div>

        {/* Simulated Barcode */}
        <div className="border-t border-dashed border-gray-300 pt-4 text-center">
          <div className="h-10 mx-auto max-w-xs flex items-center justify-center space-x-1">
            {[2,4,1,3,5,2,4,1,3,2,5,3,1,4,2,3,5,1,2,4,2,3,1,4,5,2].map((w, i) => (
              <div
                key={i}
                className="bg-gray-800 h-full"
                style={{ width: `${w * 1.5}px` }}
              />
            ))}
          </div>
          <p className="text-[10px] font-mono text-gray-500 tracking-widest mt-1.5 uppercase">
            *{ticket.booking_id}*
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Please display this ticket at the entry barrier or save on your mobile device.</p>
        </div>
      </div>
    </div>
  );
}
