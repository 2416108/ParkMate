import React from 'react';

export default function Badge({
  children,
  variant,
  size = 'md',
  className = ''
}) {
  const normalized = (variant || children || '').toString().toLowerCase().trim();

  let colorClasses = 'bg-gray-100 text-gray-700 border-gray-200';

  if (['available', 'paid', 'completed', 'active-success'].includes(normalized)) {
    colorClasses = 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]';
  } else if (['reserved', 'pending', 'active'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (['occupied', 'failed', 'cancelled'].includes(normalized)) {
    colorClasses = 'bg-red-50 text-red-700 border-red-200';
  } else if (['maintenance', 'inactive'].includes(normalized)) {
    colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  } else if (['confirmed'].includes(normalized)) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['car', 'suv', 'bike', 'van'].includes(normalized)) {
    colorClasses = 'bg-[#F7FAF7] text-gray-800 border-[#DDE5DD]';
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1 text-sm font-medium'
  };

  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${sizes[size] || sizes.md} ${colorClasses} ${className}`}>
      {children}
    </span>
  );
}
