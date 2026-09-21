import React, { useState } from 'react';
import SlotCard from './SlotCard';
import SlotLegend from './SlotLegend';
import { Layers, Filter } from 'lucide-react';

export default function SlotGrid({
  slots = [],
  selectedSlot,
  onSelectSlot,
  selectable = true,
  className = ''
}) {
  const [activeFloor, setActiveFloor] = useState('All');
  const [vehicleFilter, setVehicleFilter] = useState('All');

  // Filter slots
  const filteredSlots = slots.filter((slot) => {
    const matchesFloor = activeFloor === 'All' || slot.floor === parseInt(activeFloor, 10);
    const matchesType = vehicleFilter === 'All' || slot.vehicle_type === vehicleFilter || slot.vehicle_type === 'All';
    return matchesFloor && matchesType;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#DDE5DD]">
        {/* Floor Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5" /> Floor:
          </span>
          {['All', '1', '2'].map((fl) => (
            <button
              key={fl}
              type="button"
              onClick={() => setActiveFloor(fl)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                activeFloor === fl
                  ? 'bg-[#2E7D32] text-white shadow-sm'
                  : 'bg-[#F7FAF7] text-gray-700 hover:bg-gray-100 border border-[#DDE5DD]'
              }`}
            >
              {fl === 'All' ? 'All Floors' : `Floor ${fl}`}
            </button>
          ))}
        </div>

        {/* Vehicle Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="text-xs border border-[#DDE5DD] rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
          >
            <option value="All">All Vehicle Types</option>
            <option value="Car">Car Slots</option>
            <option value="Bike">Bike Slots</option>
            <option value="SUV">SUV Slots</option>
            <option value="Van">Van Slots</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <SlotLegend />

      {/* Slots Grid */}
      {filteredSlots.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-[#DDE5DD]">
          <p className="text-sm font-medium text-gray-500">No parking slots match the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredSlots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              isSelected={selectedSlot?.id === slot.id}
              onSelect={onSelectSlot}
              selectable={selectable}
            />
          ))}
        </div>
      )}
    </div>
  );
}
