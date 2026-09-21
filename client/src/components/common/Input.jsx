import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-lg text-sm transition-colors duration-150 border ${
            Icon ? 'pl-9' : 'pl-3'
          } pr-3 py-2 bg-white ${
            error
              ? 'border-red-400 text-red-900 placeholder-red-300 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500'
              : 'border-[#DDE5DD] text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32]'
          } disabled:bg-gray-50 disabled:text-gray-500`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
