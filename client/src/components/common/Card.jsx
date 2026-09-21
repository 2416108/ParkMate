import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  action,
  className = '',
  bodyClassName = 'p-5'
}) {
  return (
    <div className={`bg-white rounded-xl border border-[#DDE5DD] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-[#DDE5DD] flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="font-semibold text-gray-900 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>
        {children}
      </div>
    </div>
  );
}
