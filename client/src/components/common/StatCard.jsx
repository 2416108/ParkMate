import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'green',
  className = ''
}) {
  const iconColors = {
    green: 'bg-[#E8F5E9] text-[#2E7D32]',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
    red: 'bg-red-50 text-red-700',
    slate: 'bg-slate-100 text-slate-700'
  };

  return (
    <div className={`bg-white rounded-xl border border-[#DDE5DD] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconColors[color] || iconColors.green} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 flex items-center text-xs text-gray-500">
          {trend && <span className="font-medium mr-1 text-[#2E7D32]">{trend}</span>}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
