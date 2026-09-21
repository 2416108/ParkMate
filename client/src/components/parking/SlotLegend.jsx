import React from 'react';

export default function SlotLegend({ className = '' }) {
  const items = [
    { label: 'Available', colorBg: 'bg-[#E8F5E9]', colorBorder: 'border-[#2E7D32]', colorDot: 'bg-[#2E7D32]' },
    { label: 'Reserved', colorBg: 'bg-amber-50', colorBorder: 'border-amber-500', colorDot: 'bg-amber-500' },
    { label: 'Occupied', colorBg: 'bg-red-50', colorBorder: 'border-red-500', colorDot: 'bg-red-500' },
    { label: 'Maintenance', colorBg: 'bg-slate-100', colorBorder: 'border-slate-400', colorDot: 'bg-slate-400' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs ${className}`}>
      <span className="font-semibold text-gray-500 uppercase tracking-wider mr-1">Legend:</span>
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-md border ${item.colorBg} ${item.colorBorder}`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${item.colorDot}`} />
          <span className="font-medium text-gray-800">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
