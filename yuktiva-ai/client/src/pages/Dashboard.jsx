import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { projectsApi } from '../services/api.js';
import {
  Plus, Rocket, Search, TrendingUp, Shield, CheckSquare,
  FolderOpen, MoreVertical, Trash2, ExternalLink, Clock, BarChart3
} from 'lucide-react';

const PIPELINE_LABELS = {
  product_launch: { label: 'Product Launch', color: 'violet', icon: Rocket },
  fact_check: { label: 'Fact Check', color: 'cyan', icon: Search },
  strategy_pivot: { label: 'Strategy Pivot', color: 'emerald', icon: TrendingUp },
  compliance_review: { label: 'Compliance', color: 'orange', icon: Shield },
};

function StatCard({ icon: Icon, label, value, color, sub }) {
  const colors = {
    violet: 'from-violet-600/20 to-violet-900/10 border-violet-700/30 text-violet-400',
    cyan: 'from-cyan-600/20 to-cyan-900/10 border-cyan-700/30 text-cyan-400',
    emerald: 'from-emerald-600/20 to-emerald-900/10 border-emerald-700/30 text-emerald-400',
    orange: 'from-orange-600/20 to-orange-900/10 border-orange-700/30 text-orange-400',
  };
  return (
    <div className={`card bg-gradient-to-br ${colors[color]} border`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-current/10`}>
          <Icon size={20} className="" />
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const runs = project.pipelineRuns || [];
  const lastRun = runs[0];
  const pendingApprovals = runs.reduce((acc, r) => acc + (r.approvalItems?.filter(i => i.status === 'pending').length || 0), 0);

  const pipelineTypes = [...new Set(runs.map(r => r.pipelineType))];

  return (
    <div className="card glass-hover group relative animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-600/30 border border-white/10 flex items-center justify-center">
            <FolderOpen size={18} className="text-violet-400" />
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-violet-300 transition-colors">{project.name}</h3>
            <p className="text-xs text-gray-500">{project.company} · {project.userName}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 glass rounded-lg border border-white/10 shadow-xl z-10">
              <button onClick={() => { navigate(`/projects/${project.id}`); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors rounded-t-lg">
                <ExternalLink size={14} /> Open
              </button>
              <button onClick={() => { onDelete(project.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors rounded-b-lg">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {project.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Pipeline type chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {pipelineTypes.map(type => {
          const cfg = PIPELINE_LABELS[type];
          if (!cfg) return null;
          return (
            <span key={type} className={`status-badge ${
              cfg.color === 'violet' ? 'status-running' :
              cfg.color === 'cyan' ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-700/50' :
              cfg.color === 'emerald' ? 'status-complete' :
              'bg-orange-900/40 text-orange-300 border border-orange-700/50'
            }`}>
              <cfg.icon size={10} /> {cfg.label}
            </span>
          );
        })}
        {pipelineTypes.length === 0 && <span className="text-xs text-gray-600">No pipelines run yet</span>}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><BarChart3 size={12} />{runs.length} runs</span>
          {pendingApprovals > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <CheckSquare size={12} />{pendingApprovals} pending
            </span>
          )}
          {lastRun && (
            <span className="flex items-center gap-1"><Clock size={12} />{new Date(lastRun.startedAt).toLocaleDateString()}</span>
          )}
        </div>
        <button
          onClick={() => navigate(`/projects/${project.id}`)}
          className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Open →
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    try {
      const data = await projectsApi.list();
      setProjects(data.projects || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project?')) return;
    await projectsApi.delete(id);
    setProjects(p => p.filter(pr => pr.id !== id));
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRuns = projects.reduce((a, p) => a + (p.pipelineRuns?.length || 0), 0);
  const pendingApprovals = projects.reduce((a, p) =>
    a + (p.pipelineRuns || []).reduce((b, r) => b + (r.approvalItems?.filter(i => i.status === 'pending').length || 0), 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
        </div>
        <button onClick={() => navigate('/projects/new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderOpen} label="Total Projects" value={projects.length} color="violet" sub="Active projects" />
        <StatCard icon={BarChart3} label="Pipeline Runs" value={totalRuns} color="cyan" sub="All time" />
        <StatCard icon={CheckSquare} label="Pending Approvals" value={pendingApprovals} color="orange" sub="Awaiting review" />
        <StatCard icon={TrendingUp} label="Completion Rate" value={totalRuns ? `${Math.round((projects.reduce((a,p) => a + (p.pipelineRuns||[]).filter(r=>r.status!=='failed').length,0)/totalRuns)*100)}%` : '—'} color="emerald" sub="Success rate" />
      </div>

      {/* Pipeline quick access */}
      <div>
        <h2 className="section-title mb-3">Run a Pipeline</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(PIPELINE_LABELS).map(([type, cfg]) => (
            <button
              key={type}
              onClick={() => navigate(projects.length ? `/projects/${projects[0]?.id}` : '/projects/new')}
              className="card glass-hover text-left group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                cfg.color === 'violet' ? 'bg-violet-600/20' :
                cfg.color === 'cyan' ? 'bg-cyan-600/20' :
                cfg.color === 'emerald' ? 'bg-emerald-600/20' : 'bg-orange-600/20'
              }`}>
                <cfg.icon size={20} className={
                  cfg.color === 'violet' ? 'text-violet-400' :
                  cfg.color === 'cyan' ? 'text-cyan-400' :
                  cfg.color === 'emerald' ? 'text-emerald-400' : 'text-orange-400'
                } />
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">{cfg.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Your Projects</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="input-field pl-8 py-2 text-sm w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="card h-44 bg-white/3 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 card">
            <FolderOpen size={48} className="mx-auto mb-4 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-500 mb-2">
              {search ? 'No projects match your search' : 'No projects yet'}
            </h3>
            {!search && (
              <button onClick={() => navigate('/projects/new')} className="btn-primary mt-3">
                <Plus size={16} /> Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => <ProjectCard key={p.id} project={p} onDelete={handleDelete} />)}
          </div>
        )}
      </div>
    </div>
  );
}
