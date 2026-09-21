import React from 'react';
import { Menu, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenuClick, title }) {
  const { user, isAdmin } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-[#DDE5DD] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#F7FAF7] border-[#DDE5DD] text-gray-700">
          {isAdmin ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>Administrator</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>Customer</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="hidden md:inline text-xs font-medium text-gray-800">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
