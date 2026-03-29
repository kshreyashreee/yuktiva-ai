import React, { useState } from 'react';
import PipelineBase from '../components/PipelineBase.jsx';

function FactCheckForm({ handleRun, running }) {
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState('text');
  const [url, setUrl] = useState('');

  function onRun(e) {
    e.preventDefault();
    const text = content.trim() || url.trim();
    if (!text) { alert('Please enter content or a URL to fact-check.'); return; }
    handleRun({ content: text, text, url }, { sourceType });
  }

  return (
    <form onSubmit={onRun} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Content Type</label>
        <div className="flex gap-2">
          {[
            { id: 'text', label: '📝 Text / Article' },
            { id: 'url', label: '🔗 URL / Link' },
            { id: 'doc', label: '📄 Uploaded Document' },
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSourceType(opt.id)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                sourceType === opt.id
                  ? 'border-cyan-500/60 bg-cyan-900/30 text-cyan-300'
                  : 'border-white/10 bg-white/4 text-gray-500 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {sourceType === 'url' ? (
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1.5">URL to Fact-Check</label>
          <input
            className="input-field"
            placeholder="https://example.com/article"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <p className="text-xs text-gray-600 mt-1">Note: The agent will fact-check based on provided URL context. Select uploaded document for direct text analysis.</p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1.5">
            Content to Fact-Check <span className="text-red-400">*</span>
          </label>
          <textarea
            className="input-field min-h-[200px] resize-none text-sm"
            placeholder="Paste the article, blog post, social media post, or any content you want to verify...

The AI will:
• Extract all verifiable claims
• Cross-reference against its knowledge base
• Rate each claim as True / False / Misleading / Unverifiable
• Generate a credibility score and detailed report"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
      )}

      {sourceType === 'doc' && (
        <div className="p-3 rounded-lg bg-cyan-900/15 border border-cyan-700/30 text-xs text-cyan-400">
          Select documents using the panel below. The agent will extract and fact-check all text content.
        </div>
      )}

      <button type="submit" disabled={running} className="w-full btn-primary py-3 flex items-center justify-center gap-2" style={{ background: running ? undefined : 'linear-gradient(135deg, #0891b2, #0e7490)' }}>
        {running ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Fact-Checking...</>
        ) : '🔍 Run Fact Check'}
      </button>

      <div className="p-3 rounded-lg bg-white/4 border border-white/8 text-xs text-gray-500">
        <p className="font-semibold text-gray-400 mb-1">3-Agent fact-check pipeline:</p>
        <p>① Extracts all verifiable claims → ② Cross-references each claim → ③ Generates credibility report</p>
      </div>
    </form>
  );
}

export default function FactCheck() {
  return (
    <PipelineBase
      pipelineType="fact_check"
      title="Fact Check"
      icon="🔍"
      description="Verify any content's claims through a 3-stage AI pipeline. Get a credibility score, flagged claims, and a detailed verification report."
      color="cyan"
      renderInputs={(props) => <FactCheckForm {...props} />}
    />
  );
}
