import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white focus:ring-[#2E7D32] shadow-sm',
    secondary: 'bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] focus:ring-[#2E7D32]',
    outline: 'border border-[#DDE5DD] hover:border-[#2E7D32] hover:bg-[#F7FAF7] text-[#1F2937] focus:ring-[#2E7D32]',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 shadow-sm',
    dangerOutline: 'border border-red-300 hover:bg-red-50 text-red-600 focus:ring-red-500',
    ghost: 'hover:bg-gray-100 text-[#1F2937] focus:ring-gray-300'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
