import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { projectsApi } from '../services/api.js';
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye, EyeOff, Send, AlertTriangle, RefreshCw } from 'lucide-react';

function ContentPreview({ item }) {
  const [expanded, setExpanded] = useState(false);
  const content = item.content;

  function renderContent() {
    if (!content) return <p className="text-gray-600 italic">No content preview available</p>;

    if (item.type === 'blog_post') {
      return (
        <div className="space-y-3">
          <div className="font-bold text-white text-lg">{content.title}</div>
          {content.seoMeta && <p className="text-xs text-gray-500 italic">SEO: {content.seoMeta}</p>}
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{content.content?.slice(0, expanded ? undefined : 400)}{!expanded && content.content?.length > 400 ? '...' : ''}</div>
          {content.readingTime && <p className="text-xs text-gray-600">⏱ {content.readingTime}</p>}
        </div>
      );
    }

    if (item.type?.startsWith('social_')) {
      const platform = item.type.replace('social_', '');
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-300 leading-relaxed">{content.text || content.caption}</p>
          {content.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {content.hashtags.map(h => (
                <span key={h} className="text-xs text-violet-400">#{h.replace('#','')}</span>
              ))}
            </div>
          )}
          {content.charCount && <p className="text-xs text-gray-600">{content.charCount} characters</p>}
        </div>
      );
    }

    if (item.type === 'faq') {
      const faqList = Array.isArray(content) ? content : content.items || [];
      return (
        <div className="space-y-3">
          {faqList.slice(0, expanded ? undefined : 3).map((q, i) => (
            <div key={i} className="border-l-2 border-violet-700/50 pl-3">
              <p className="text-sm font-semibold text-white">Q: {q.question}</p>
              <p className="text-sm text-gray-400 mt-1">A: {q.answer}</p>
            </div>
          ))}
          {!expanded && faqList.length > 3 && <p className="text-xs text-gray-600">+{faqList.length - 3} more questions...</p>}
        </div>
      );
    }

    if (item.type === 'ad_copy') {
      return (
        <div className="space-y-2">
          <div className="text-lg font-black text-white">{content.headline}</div>
          <div className="text-sm font-semibold text-violet-300">{content.subheadline}</div>
          <div className="text-sm text-gray-400">{content.body}</div>
          {content.cta && <div className="inline-block px-4 py-1.5 bg-violet-600 text-white text-sm rounded-lg font-medium">{content.cta}</div>}
        </div>
      );
    }

    // Default JSON view
    return (
      <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
        {JSON.stringify(content, null, 2).slice(0, expanded ? undefined : 600)}
        {!expanded && JSON.stringify(content, null, 2).length > 600 ? '\n...' : ''}
      </pre>
    );
  }

  return (
    <div>
      {renderContent()}
      {item.complianceScore && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${item.complianceScore}%` }} />
          </div>
          <span className="text-xs text-gray-500">{item.complianceScore}% compliant</span>
        </div>
      )}
      <button onClick={() => setExpanded(s => !s)} className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
        {expanded ? <EyeOff size={13} /> : <Eye size={13} />}
        {expanded ? 'Show less' : 'Show full content'}
      </button>
    </div>
  );
}

function ApprovalItem({ item, runId, projectId, onUpdate }) {
  const [action, setAction] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const typeLabels = {
    blog_post: '📝 Blog Post', social_twitter: '🐦 Twitter/X', social_linkedin: '💼 LinkedIn',
    social_instagram: '📸 Instagram', localized_content: '🌍 Localized', faq: '❓ FAQ',
    ad_copy: '📢 Ad Copy', fact_check_report: '🔍 Fact Check', strategy_report: '📊 Strategy',
    content_calendar: '📅 Calendar', compliance_report: '🛡️ Compliance', remediated_content: '✅ Remediated',
  };

  async function submit() {
    if (!action) return;
    setLoading(true);
    try {
      await projectsApi.approve(projectId, runId, item.id, action, feedback);
      onUpdate();
    } catch (e) { alert(e.message); }
    setLoading(false);
  }

  const statusColors = {
    pending: 'border-amber-700/40 bg-amber-900/10',
    approved: 'border-emerald-700/40 bg-emerald-900/10',
    rejected: 'border-red-700/40 bg-red-900/10',
  };

  return (
    <div className={`card border ${statusColors[item.status] || 'border-white/10'} space-y-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white">{typeLabels[item.type] || item.title}</span>
            <span className={`status-badge ${
              item.status === 'pending' ? 'status-pending' :
              item.status === 'approved' ? 'status-complete' : 'status-failed'
            }`}>
              {item.status}
            </span>
          </div>
          {item.reviewedBy && (
            <p className="text-xs text-gray-600">Reviewed by {item.reviewedBy} · {item.reviewedAt && new Date(item.reviewedAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Content preview */}
      <div className="p-4 rounded-xl bg-white/3 border border-white/8">
        <ContentPreview item={item} />
      </div>

      {/* Action area (only if pending) */}
      {item.status === 'pending' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setAction('approve')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                action === 'approve'
                  ? 'border-emerald-500/60 bg-emerald-900/30 text-emerald-300'
                  : 'border-white/10 bg-white/4 text-gray-400 hover:text-emerald-400 hover:border-emerald-700/40'
              }`}
            >
              <CheckCircle size={16} /> Approve
            </button>
            <button
              onClick={() => setAction('reject')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                action === 'reject'
                  ? 'border-red-500/60 bg-red-900/30 text-red-300'
                  : 'border-white/10 bg-white/4 text-gray-400 hover:text-red-400 hover:border-red-700/40'
              }`}
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
          {action && (
            <>
              <textarea
                className="input-field text-sm resize-none min-h-[60px]"
                placeholder={action === 'approve' ? 'Optional notes for publisher...' : 'Reason for rejection / feedback for revision...'}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
              <button onClick={submit} disabled={loading} className="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</> :
                  <><Send size={14} /> Submit {action === 'approve' ? 'Approval' : 'Rejection'}</>}
              </button>
            </>
          )}
        </div>
      )}

      {item.feedback && item.status !== 'pending' && (
        <div className="text-xs text-gray-500 italic p-2 bg-white/3 rounded-lg">Feedback: {item.feedback}</div>
      )}
    </div>
  );
}

export default function ApprovalGate() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRunId = searchParams.get('runId');

  const [project, setProject] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(preselectedRunId || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProject(); }, [projectId]);

  async function fetchProject() {
    setLoading(true);
    try {
      const data = await projectsApi.get(projectId);
      setProject(data.project);
      if (preselectedRunId) setSelectedRunId(preselectedRunId);
      else if (!selectedRunId && data.project.pipelineRuns?.length > 0) {
        setSelectedRunId(data.project.pipelineRuns[0].id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500"><RefreshCw size={20} className="animate-spin mr-2" /> Loading...</div>;
  if (!project) return <div className="text-center py-16 text-gray-500">Project not found.</div>;

  const runs = project.pipelineRuns || [];
  const selectedRun = runs.find(r => r.id === selectedRunId);
  const pendingTotal = runs.reduce((a, r) => a + (r.approvalItems?.filter(i => i.status === 'pending').length || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/projects/${projectId}`)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2 text-sm text-amber-400 mb-1">
            <Clock size={14} /> Human Approval Gate
          </div>
          <h1 className="page-title">Review & Approve Content</h1>
          {pendingTotal > 0 && <p className="text-amber-400 text-sm mt-1">⚠️ {pendingTotal} item{pendingTotal > 1 ? 's' : ''} pending review across all runs</p>}
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="card text-center py-12">
          <Clock size={40} className="mx-auto mb-3 text-gray-700" />
          <p className="text-gray-500">No pipeline runs yet. Run a pipeline to generate content for review.</p>
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn-primary mt-4">Go to Project</button>
        </div>
      ) : (
        <>
          {/* Run selector */}
          <div className="card">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Select Pipeline Run</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {runs.map(run => {
                const pending = run.approvalItems?.filter(i => i.status === 'pending').length || 0;
                return (
                  <button
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      selectedRunId === run.id ? 'border-violet-500/60 bg-violet-900/20' : 'border-white/8 hover:border-white/15'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white capitalize">{run.pipelineType?.replace(/_/g, ' ')}</span>
                        <span className={`status-badge ${run.status === 'awaiting_approval' ? 'status-pending' : run.status === 'published' ? 'status-complete' : 'status-failed'}`}>
                          {run.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">By {run.startedBy} · {new Date(run.startedAt).toLocaleString()}</p>
                    </div>
                    {pending > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                        <AlertTriangle size={12} /> {pending}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Approval items */}
          {selectedRun && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="section-title">Content Items ({selectedRun.approvalItems?.length || 0})</h2>
                <div className="flex gap-2 text-xs">
                  <span className="status-badge status-pending">{selectedRun.approvalItems?.filter(i => i.status === 'pending').length || 0} pending</span>
                  <span className="status-badge status-complete">{selectedRun.approvalItems?.filter(i => i.status === 'approved').length || 0} approved</span>
                  <span className="status-badge status-failed">{selectedRun.approvalItems?.filter(i => i.status === 'rejected').length || 0} rejected</span>
                </div>
              </div>
              {(selectedRun.approvalItems || []).map(item => (
                <ApprovalItem
                  key={item.id}
                  item={item}
                  runId={selectedRun.id}
                  projectId={projectId}
                  onUpdate={fetchProject}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
