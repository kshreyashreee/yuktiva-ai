import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  LayoutDashboard, FolderOpen, Rocket, Search, TrendingUp,
  Shield, CheckSquare, Settings, FileText, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects/new', icon: FolderOpen, label: 'New Project' },
];

const toolItems = [
  { icon: Rocket, label: 'Product Launch', path: 'launch', color: 'text-violet-400' },
  { icon: Search, label: 'Fact Check', path: 'factcheck', color: 'text-cyan-400' },
  { icon: TrendingUp, label: 'Strategy Pivot', path: 'strategy', color: 'text-emerald-400' },
  { icon: Shield, label: 'Compliance Review', path: 'compliance', color: 'text-orange-400' },
  { icon: CheckSquare, label: 'Approval Gate', path: 'approve', color: 'text-blue-400' },
];

export default function Sidebar({ open, onToggle }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={`${open ? 'w-60' : 'w-16'} flex-shrink-0 transition-all duration-300 bg-dark-800 border-r border-white/5 flex flex-col`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Zap size={16} className="text-white" />
          </div>
          {open && <span className="font-bold text-white text-lg whitespace-nowrap">Yuktiva AI</span>}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} className="flex-shrink-0" />
            {open && <span>{item.label}</span>}
          </NavLink>
        ))}

        {open && <div className="pt-4 pb-1 px-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">Pipeline Tools</div>}
        <div className={`${!open ? 'mt-3' : ''} space-y-1`}>
          {toolItems.map(item => (
            <div
              key={item.path}
              onClick={() => navigate('/dashboard')}
              className="sidebar-item cursor-pointer"
              title={!open ? item.label : ''}
            >
              <item.icon size={18} className={`flex-shrink-0 ${item.color}`} />
              {open && <span>{item.label}</span>}
            </div>
          ))}
        </div>

        {open && <div className="pt-4 pb-1 px-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">System</div>}
        <NavLink
          to="/logs"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          title={!open ? 'System Logs' : ''}
        >
          <FileText size={18} className="flex-shrink-0" />
          {open && <span>System Logs</span>}
        </NavLink>
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            title={!open ? 'Admin Panel' : ''}
          >
            <Settings size={18} className="flex-shrink-0" />
            {open && <span>Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      {/* User + Toggle */}
      <div className="p-3 border-t border-white/5 space-y-2">
        {open && user && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/4">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-gray-500 truncate">{user.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors"
        >
          {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
