import React from 'react';
import { Car, Bike, Truck, Check, Wrench, ShieldAlert } from 'lucide-react';

export default function SlotCard({
  slot,
  isSelected = false,
  onSelect,
  selectable = true,
  showRate = true,
  className = ''
}) {
  const isAvailable = slot.status === 'Available';
  const isReserved = slot.status === 'Reserved';
  const isOccupied = slot.status === 'Occupied';
  const isMaintenance = slot.status === 'Maintenance';

  const canClick = selectable && isAvailable;

  const handleClick = () => {
    if (canClick && onSelect) {
      onSelect(slot);
    }
  };

  const getVehicleIcon = (type) => {
    if (type === 'Bike') return <Bike className="w-3.5 h-3.5" />;
    if (type === 'Van' || type === 'SUV') return <Truck className="w-3.5 h-3.5" />;
    return <Car className="w-3.5 h-3.5" />;
  };

  // Status-based styling
  let containerStyle = 'bg-white border-[#DDE5DD] text-gray-700';

  if (isSelected) {
    containerStyle = 'bg-[#E8F5E9] border-2 border-[#2E7D32] text-[#2E7D32] ring-2 ring-[#2E7D32]/20 shadow-md';
  } else if (isAvailable) {
    containerStyle = 'bg-white border-[#C8E6C9] hover:border-[#2E7D32] hover:bg-[#F7FAF7] cursor-pointer text-gray-900 shadow-sm';
  } else if (isReserved) {
    containerStyle = 'bg-amber-50/70 border-amber-300 text-amber-900 cursor-not-allowed opacity-90';
  } else if (isOccupied) {
    containerStyle = 'bg-red-50/70 border-red-300 text-red-900 cursor-not-allowed opacity-90';
  } else if (isMaintenance) {
    containerStyle = 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed opacity-80';
  }

  return (
    <div
      onClick={handleClick}
      className={`relative p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between select-none ${containerStyle} ${className}`}
    >
      {/* Top row: Slot number + selected mark or status indicator */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-base tracking-tight">{slot.slot_number}</span>
        {isSelected ? (
          <div className="w-5 h-5 rounded-full bg-[#2E7D32] text-white flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
            {getVehicleIcon(slot.vehicle_type)}
            <span className="hidden sm:inline">{slot.vehicle_type}</span>
          </div>
        )}
      </div>

      {/* Middle: Floor indicator */}
      <div className="my-2">
        <p className="text-[11px] text-gray-500 font-medium">
          Floor {slot.floor} &bull; Sec {slot.section}
        </p>
      </div>

      {/* Bottom row: Rate & Status label */}
      <div className="pt-2 border-t border-gray-100/80 flex items-center justify-between text-xs">
        {showRate ? (
          <span className="font-semibold text-gray-800">₹{slot.hourly_rate}<span className="text-[10px] text-gray-500 font-normal">/hr</span></span>
        ) : <span />}

        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
            isAvailable
              ? 'bg-[#E8F5E9] text-[#2E7D32]'
              : isReserved
              ? 'bg-amber-100 text-amber-800'
              : isOccupied
              ? 'bg-red-100 text-red-800'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {isMaintenance && <Wrench className="w-2.5 h-2.5 inline mr-1" />}
          {isOccupied && <ShieldAlert className="w-2.5 h-2.5 inline mr-1" />}
          {slot.status}
        </span>
      </div>
    </div>
  );
}
