import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsApi } from '../services/api.js';
import DocumentManager from '../components/DocumentManager.jsx';
import SocialConnect from '../components/SocialConnect.jsx';
import {
  ArrowLeft, Rocket, Search, TrendingUp, Shield, CheckSquare,
  FolderOpen, Clock, BarChart3, Link2, FileText, AlertTriangle, ChevronRight
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'pipelines', label: 'Pipeline History', icon: Clock },
  { id: 'social', label: 'Social Connect', icon: Link2 },
];

const PIPELINE_TOOLS = [
  { type: 'product_launch', label: '🚀 Product Launch', desc: 'Full content suite from a spec', path: 'launch', color: 'violet' },
  { type: 'fact_check', label: '🔍 Fact Check', desc: 'Verify any content\'s claims', path: 'factcheck', color: 'cyan' },
  { type: 'strategy_pivot', label: '📊 Strategy Pivot', desc: 'AI-powered recommendations', path: 'strategy', color: 'emerald' },
  { type: 'compliance_review', label: '🛡️ Compliance Review', desc: 'Review content for violations', path: 'compliance', color: 'orange' },
];

function PipelineRunRow({ run, projectId }) {
  const navigate = useNavigate();
  const pendingCount = run.approvalItems?.filter(i => i.status === 'pending').length || 0;
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-white/8 hover:border-white/15 transition-all group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`status-badge ${
            run.status === 'running' ? 'status-running' :
            run.status === 'published' || run.status === 'awaiting_approval' ? 'status-complete' :
            run.status === 'failed' ? 'status-failed' : 'status-pending'
          }`}>
            {run.status?.replace('_', ' ')}
          </span>
          <span className="text-xs text-gray-500 capitalize">{run.pipelineType?.replace('_', ' ')}</span>
        </div>
        <p className="text-xs text-gray-600">
          By {run.startedBy} · {new Date(run.startedAt).toLocaleString()}
        </p>
      </div>
      {pendingCount > 0 && (
        <span className="status-badge status-pending">
          <AlertTriangle size={10} /> {pendingCount} pending review
        </span>
      )}
      {run.approvalItems?.length > 0 && (
        <button
          onClick={() => navigate(`/projects/${projectId}/approve?runId=${run.id}`)}
          className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
        >
          Review <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchProject(); }, [id]);

  async function fetchProject() {
    try {
      const data = await projectsApi.get(id);
      setProject(data.project);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading project...</div>;
  if (!project) return <div className="text-center py-16 text-gray-500">Project not found.</div>;

  const runs = project.pipelineRuns || [];
  const pendingApprovals = runs.reduce((a, r) => a + (r.approvalItems?.filter(i => i.status === 'pending').length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors mt-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-600/30 border border-white/10 flex items-center justify-center">
              <FolderOpen size={18} className="text-violet-400" />
            </div>
            <h1 className="page-title">{project.name}</h1>
          </div>
          {project.description && <p className="text-gray-500 ml-14 text-sm">{project.description}</p>}
          <div className="flex items-center gap-3 ml-14 mt-1">
            {project.tags?.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-gray-400">{t}</span>
            ))}
          </div>
        </div>
        {pendingApprovals > 0 && (
          <button
            onClick={() => navigate(`/projects/${id}/approve`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-900/30 border border-amber-700/40 text-amber-300 text-sm font-medium hover:bg-amber-900/50 transition-all"
          >
            <AlertTriangle size={15} /> {pendingApprovals} Pending Approval
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 rounded-xl p-1 border border-white/8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/8'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
            {tab.id === 'pipelines' && runs.length > 0 && (
              <span className="ml-1 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{runs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {project.about && (
            <div className="card border-violet-800/30">
              <h3 className="font-semibold text-white mb-2">About</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{project.about}</p>
            </div>
          )}

          <div>
            <h2 className="section-title mb-4">Run a Pipeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PIPELINE_TOOLS.map(tool => (
                <Link
                  key={tool.type}
                  to={`/projects/${id}/${tool.path}`}
                  className="card glass-hover group flex items-start gap-4"
                >
                  <div className={`p-3 rounded-xl flex-shrink-0 ${
                    tool.color === 'violet' ? 'bg-violet-600/20' :
                    tool.color === 'cyan' ? 'bg-cyan-600/20' :
                    tool.color === 'emerald' ? 'bg-emerald-600/20' : 'bg-orange-600/20'
                  }`}>
                    <span className="text-2xl">{tool.label.split(' ')[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                      {tool.label.split(' ').slice(1).join(' ')}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{tool.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-violet-400 transition-colors mt-1" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pipeline Runs', value: runs.length, color: 'text-violet-400' },
              { label: 'Pending Approvals', value: pendingApprovals, color: 'text-amber-400' },
              { label: 'Social Accounts', value: project.socialAccounts?.filter(s => s.connected).length || 0, color: 'text-cyan-400' },
            ].map(stat => (
              <div key={stat.label} className="card text-center">
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="card">
          <h2 className="section-title mb-4">Documents</h2>
          <DocumentManager projectId={id} selectable={false} />
        </div>
      )}

      {activeTab === 'pipelines' && (
        <div className="card">
          <h2 className="section-title mb-4">Pipeline History</h2>
          {runs.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <Clock size={32} className="mx-auto mb-2 opacity-40" />
              <p>No pipeline runs yet. Start with a pipeline tool.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {runs.map(run => <PipelineRunRow key={run.id} run={run} projectId={id} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'social' && (
        <div className="card">
          <SocialConnect
            projectId={id}
            accounts={project.socialAccounts || []}
            onUpdate={fetchProject}
          />
        </div>
      )}
    </div>
  );
}
