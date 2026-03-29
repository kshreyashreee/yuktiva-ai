import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi, documentsApi, runPipeline, parsePipelineStream } from '../services/api.js';
import DocumentManager from '../components/DocumentManager.jsx';
import AgentPipelineView from '../components/AgentPipelineView.jsx';
import { ArrowLeft, Play, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function PipelineBase({
  pipelineType,
  title,
  icon,
  description,
  color = 'violet',
  renderInputs,
  buildInput,
  buildOptions,
}) {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [docs, setDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [showDocs, setShowDocs] = useState(false);
  const [lastRunId, setLastRunId] = useState(null);

  useEffect(() => {
    projectsApi.get(projectId).then(d => setProject(d.project)).catch(console.error);
    documentsApi.list(projectId).then(d => setDocs(d.documents || [])).catch(console.error);
  }, [projectId]);

  async function handleRun(inputData, optionsData) {
    setRunning(true);
    setDone(false);
    setEvents([]);
    setError('');

    try {
      const payload = {
        projectId,
        pipelineType,
        input: { ...inputData, documentIds: selectedDocIds },
        options: optionsData || {}
      };
      const response = await runPipeline(payload);
      await parsePipelineStream(response, (ev) => {
        setEvents(prev => [...prev, ev]);
        if (ev.type === 'pipeline_complete') {
          setLastRunId(ev.run?.id);
          setDone(true);
          setRunning(false);
        }
        if (ev.type === 'pipeline_error') {
          setError(ev.error || ev.message);
          setRunning(false);
        }
      });
    } catch (err) {
      setError(err.message);
      setRunning(false);
    }
  }

  const bgMap = {
    violet: 'from-violet-600/10 to-transparent',
    cyan: 'from-cyan-600/10 to-transparent',
    emerald: 'from-emerald-600/10 to-transparent',
    orange: 'from-orange-600/10 to-transparent',
  };
  const textMap = {
    violet: 'text-violet-400', cyan: 'text-cyan-400', emerald: 'text-emerald-400', orange: 'text-orange-400',
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(`/projects/${projectId}`)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors mt-1">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className={`flex items-center gap-2 text-sm font-medium ${textMap[color]} mb-1`}>
            {icon} {project?.name}
          </div>
          <h1 className="page-title">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="space-y-4">
          <div className={`card bg-gradient-to-br ${bgMap[color]}`}>
            <h2 className="section-title mb-4">Configure Pipeline</h2>
            {renderInputs({ handleRun, running, docs, selectedDocIds })}
          </div>

          {/* Doc selector */}
          <div className="card">
            <button onClick={() => setShowDocs(s => !s)} className="w-full flex items-center justify-between text-sm font-semibold text-white">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                Use Uploaded Documents ({selectedDocIds.length} selected)
              </div>
              {showDocs ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
            </button>
            {showDocs && (
              <div className="mt-4 animate-fade-in">
                <DocumentManager
                  projectId={projectId}
                  selectable={true}
                  selectedIds={selectedDocIds}
                  onSelect={setSelectedDocIds}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Pipeline view */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="section-title mb-4">Agent Pipeline</h2>
            <AgentPipelineView pipelineType={pipelineType} events={events} />
          </div>

          {error && (
            <div className="p-4 rounded-xl border border-red-700/50 bg-red-900/20 text-red-300 text-sm">
              <p className="font-semibold mb-1">⚠️ Pipeline Error</p>
              <p>{error}</p>
              {error.includes('API_KEY') && (
                <p className="mt-2 text-xs text-red-400">Please add your GROQ_API_KEY to the .env file and restart the server. Get a free key at console.groq.com</p>
              )}
            </div>
          )}

          {done && lastRunId && (
            <div className="p-4 rounded-xl border border-emerald-700/40 bg-emerald-900/15">
              <p className="text-emerald-300 font-semibold mb-1">✅ Pipeline Complete!</p>
              <p className="text-emerald-400/70 text-sm mb-3">Content generated and queued for human review.</p>
              <button
                onClick={() => navigate(`/projects/${projectId}/approve?runId=${lastRunId}`)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Play size={14} /> Review in Approval Gate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
