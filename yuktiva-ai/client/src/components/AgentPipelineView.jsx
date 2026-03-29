import React from 'react';
import { CheckCircle, Circle, AlertCircle, Loader, Bot, ChevronDown, ChevronRight } from 'lucide-react';

const PIPELINE_CONFIGS = {
  product_launch: [
    { name: 'Drafter Agent', desc: 'Creates blog post, social variants, FAQ & ad copy', color: 'violet' },
    { name: 'Localizer Agent', desc: 'Translates & adapts content to regional language', color: 'cyan' },
    { name: 'Brand Reviewer Agent', desc: 'Checks tone, voice & brand guideline compliance', color: 'emerald' },
    { name: 'Compliance Agent', desc: 'Flags regulatory issues & suggests rewrites', color: 'orange' },
    { name: 'Publisher Agent', desc: 'Packages content for multi-channel distribution', color: 'blue' },
    { name: 'Human Approval Gate', desc: 'Review & approve content before publishing', color: 'pink' },
  ],
  fact_check: [
    { name: 'Claim Extractor Agent', desc: 'Identifies all verifiable claims in content', color: 'violet' },
    { name: 'Research & Verification Agent', desc: 'Cross-references claims against knowledge base', color: 'cyan' },
    { name: 'Report Generator Agent', desc: 'Produces detailed credibility report', color: 'emerald' },
  ],
  strategy_pivot: [
    { name: 'Analytics Analyzer Agent', desc: 'Processes performance data & identifies patterns', color: 'violet' },
    { name: 'Strategy Recommendation Agent', desc: 'Generates actionable strategy recommendations', color: 'cyan' },
    { name: 'Content Calendar Agent', desc: 'Creates 4-week optimized content calendar', color: 'emerald' },
  ],
  compliance_review: [
    { name: 'Content Scanner Agent', desc: 'Deep scans for regulatory violations', color: 'violet' },
    { name: 'Remediation Agent', desc: 'Rewrites content to be fully compliant', color: 'cyan' },
    { name: 'Compliance Report Agent', desc: 'Generates executive compliance audit report', color: 'emerald' },
  ]
};

const colorMap = {
  violet: { dot: 'bg-violet-500', ring: 'ring-violet-500/40', text: 'text-violet-400', border: 'border-violet-500/40 bg-violet-900/15' },
  cyan: { dot: 'bg-cyan-500', ring: 'ring-cyan-500/40', text: 'text-cyan-400', border: 'border-cyan-500/40 bg-cyan-900/15' },
  emerald: { dot: 'bg-emerald-500', ring: 'ring-emerald-500/40', text: 'text-emerald-400', border: 'border-emerald-500/40 bg-emerald-900/15' },
  orange: { dot: 'bg-orange-500', ring: 'ring-orange-500/40', text: 'text-orange-400', border: 'border-orange-500/40 bg-orange-900/15' },
  blue: { dot: 'bg-blue-500', ring: 'ring-blue-500/40', text: 'text-blue-400', border: 'border-blue-500/40 bg-blue-900/15' },
  pink: { dot: 'bg-pink-500', ring: 'ring-pink-500/40', text: 'text-pink-400', border: 'border-pink-500/40 bg-pink-900/15' },
};

function StepIcon({ status }) {
  if (status === 'complete') return <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />;
  if (status === 'running') return <Loader size={20} className="text-violet-400 flex-shrink-0 animate-spin" />;
  if (status === 'error') return <AlertCircle size={20} className="text-red-400 flex-shrink-0" />;
  return <Circle size={20} className="text-gray-600 flex-shrink-0" />;
}

export default function AgentPipelineView({ pipelineType, events, result }) {
  const [expandedStep, setExpandedStep] = React.useState(null);
  const steps = PIPELINE_CONFIGS[pipelineType] || [];

  // Build step status from events
  const stepStatuses = {};
  const stepResults = {};
  events.forEach(ev => {
    if (ev.type === 'agent_start') {
      stepStatuses[ev.agent] = 'running';
    } else if (ev.type === 'agent_complete') {
      stepStatuses[ev.agent] = 'complete';
      stepResults[ev.agent] = ev.result;
    } else if (ev.type === 'pipeline_error') {
      // mark last running as error
      Object.keys(stepStatuses).forEach(k => {
        if (stepStatuses[k] === 'running') stepStatuses[k] = 'error';
      });
    }
  });

  const isPipelineComplete = events.some(e => e.type === 'pipeline_complete');
  const isPipelineError = events.some(e => e.type === 'pipeline_error');
  const currentRunning = steps.findIndex(s => stepStatuses[s.name] === 'running');

  return (
    <div className="space-y-3">
      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Pipeline Progress</span>
          <span>{Object.values(stepStatuses).filter(s => s === 'complete').length}/{steps.length} agents</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${(Object.values(stepStatuses).filter(s => s === 'complete').length / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {steps.map((step, idx) => {
        const status = stepStatuses[step.name] || 'pending';
        const c = colorMap[step.color];
        const isExpanded = expandedStep === idx;
        const res = stepResults[step.name];

        return (
          <div key={idx}>
            <div
              className={`agent-step ${status} ${status === 'complete' ? c.border : ''} cursor-pointer`}
              onClick={() => setExpandedStep(isExpanded ? null : idx)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ${
                status === 'running' ? `ring-violet-500/60 bg-violet-900/40` :
                status === 'complete' ? `${c.ring} bg-emerald-900/30` :
                status === 'error' ? 'ring-red-500/40 bg-red-900/30' :
                'ring-white/10 bg-white/5'
              }`}>
                {status === 'running' ? <Bot size={16} className={`${c.text} animate-pulse`} /> :
                 status === 'complete' ? <Bot size={16} className="text-emerald-400" /> :
                 status === 'error' ? <Bot size={16} className="text-red-400" /> :
                 <span className="text-gray-600 text-xs font-bold">{idx + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className={`text-sm font-semibold ${status === 'pending' ? 'text-gray-600' : 'text-white'}`}>{step.name}</p>
                    <p className="text-xs text-gray-500">{step.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {status !== 'pending' && (
                      <span className={`status-badge ${
                        status === 'running' ? 'status-running' :
                        status === 'complete' ? 'status-complete' :
                        status === 'error' ? 'status-failed' : 'status-pending'
                      }`}>
                        {status}
                      </span>
                    )}
                    {res && (isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />)}
                  </div>
                </div>
                {status === 'running' && (
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Expanded result */}
            {isExpanded && res && (
              <div className="ml-11 mt-1 p-3 rounded-lg bg-white/3 border border-white/8 text-xs text-gray-400 max-h-48 overflow-y-auto animate-fade-in">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                  {JSON.stringify(res, null, 2).slice(0, 2000)}
                  {JSON.stringify(res, null, 2).length > 2000 ? '\n... (truncated)' : ''}
                </pre>
              </div>
            )}

            {/* Connector */}
            {idx < steps.length - 1 && (
              <div className="ml-4 w-px h-3 bg-gradient-to-b from-white/20 to-transparent" />
            )}
          </div>
        );
      })}

      {/* Final status */}
      {(isPipelineComplete || isPipelineError) && (
        <div className={`p-3 rounded-xl border text-sm font-medium ${
          isPipelineComplete
            ? 'border-emerald-500/40 bg-emerald-900/20 text-emerald-300'
            : 'border-red-500/40 bg-red-900/20 text-red-300'
        }`}>
          {isPipelineComplete
            ? '✅ Pipeline complete — Content queued for human approval'
            : '❌ Pipeline failed — Check system logs for details'}
        </div>
      )}
    </div>
  );
}

// Groq model info exported for display
export const GROQ_MODELS = {
  large: 'llama-3.3-70b-versatile',
  small: 'llama-3.1-8b-instant',
};
