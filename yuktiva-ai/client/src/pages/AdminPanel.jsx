import React, { useState, useEffect } from 'react';
import { authApi, projectsApi } from '../services/api.js';
import { Shield, Users, FolderOpen, BarChart3, RefreshCw, ChevronDown } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [ud, pd] = await Promise.all([authApi.getUsers(), projectsApi.list()]);
      setUsers(ud.users || []);
      setProjects(pd.projects || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function updateRole(id, role) {
    try {
      await authApi.updateUserRole(id, role);
      setUsers(u => u.map(user => user.id === id ? { ...user, role } : user));
    } catch (e) { alert(e.message); }
  }

  const totalRuns = projects.reduce((a, p) => a + (p.pipelineRuns?.length || 0), 0);
  const pendingApprovals = projects.reduce((a, p) =>
    a + (p.pipelineRuns || []).reduce((b, r) => b + (r.approvalItems?.filter(i => i.status === 'pending').length || 0), 0), 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: `Users (${users.length})`, icon: Users },
    { id: 'projects', label: `Projects (${projects.length})`, icon: FolderOpen },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-red-600/30 border border-white/10 flex items-center justify-center">
          <Shield size={18} className="text-violet-400" />
        </div>
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Manage all users, projects, and system settings</p>
        </div>
        <button onClick={fetchAll} className="ml-auto p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-1 bg-white/3 rounded-xl p-1 border border-white/8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/8'
            }`}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: users.length, color: 'text-violet-400' },
            { label: 'Total Projects', value: projects.length, color: 'text-cyan-400' },
            { label: 'Pipeline Runs', value: totalRuns, color: 'text-emerald-400' },
            { label: 'Pending Approvals', value: pendingApprovals, color: 'text-amber-400' },
          ].map(stat => (
            <div key={stat.label} className="card text-center">
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-white/8">
            <h2 className="font-semibold text-white">All Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Name', 'Email', 'Company', 'Role', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-xs font-bold">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.company || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${user.role === 'admin' ? 'bg-violet-900/50 text-violet-300 border border-violet-700/50' : 'bg-gray-900/50 text-gray-300 border border-gray-700/50'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={e => updateRole(user.id, e.target.value)}
                        className="text-xs bg-white/8 border border-white/10 rounded-lg px-2 py-1 text-gray-300 focus:outline-none focus:border-violet-500"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-white/8">
            <h2 className="font-semibold text-white">All Projects</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Project', 'Owner', 'Company', 'Runs', 'Pending', 'Created'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {projects.map(p => {
                  const pending = (p.pipelineRuns || []).reduce((a, r) => a + (r.approvalItems?.filter(i => i.status === 'pending').length || 0), 0);
                  return (
                    <tr key={p.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{p.name}</p>
                        <p className="text-xs text-gray-600">{p.description?.slice(0, 40)}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{p.userName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.company}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{p.pipelineRuns?.length || 0}</td>
                      <td className="px-4 py-3">
                        {pending > 0 ? (
                          <span className="status-badge status-pending">{pending}</span>
                        ) : <span className="text-gray-600 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
