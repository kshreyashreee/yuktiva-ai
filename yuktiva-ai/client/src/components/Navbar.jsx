import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Menu, Bell, LogOut, User, Settings, ChevronDown, Shield } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-16 bg-dark-800 border-b border-white/5 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors">
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-600">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          <span>All systems operational</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/8 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-white leading-tight">{user?.name}</div>
              <div className="text-xs text-gray-500 leading-tight capitalize">{user?.role}</div>
            </div>
            <ChevronDown size={14} className={`text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 glass rounded-xl border border-white/10 shadow-2xl shadow-black/50 z-50 overflow-hidden animate-fade-in">
              <div className="p-3 border-b border-white/8">
                <div className="text-sm font-semibold text-white">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
                <div className="mt-1 text-xs text-gray-600">{user?.company}</div>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/8 text-gray-300 hover:text-white text-sm transition-colors">
                  <User size={15} /> Profile
                </button>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/8 text-violet-400 hover:text-violet-300 text-sm transition-colors"
                  >
                    <Shield size={15} /> Admin Panel
                  </Link>
                )}
                <Link
                  to="/logs"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/8 text-gray-300 hover:text-white text-sm transition-colors"
                >
                  <Settings size={15} /> System Logs
                </Link>
              </div>
              <div className="p-1.5 border-t border-white/8">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-900/30 text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
