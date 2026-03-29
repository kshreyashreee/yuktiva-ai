import React, { useState } from 'react';
import PipelineBase from '../components/PipelineBase.jsx';

const SAMPLE_DATA = {
  videoVsText: { videoViews: 45000, textViews: 11000, videoEngagement: '8.2%', textEngagement: '1.9%', videoShares: 2100, textShares: 180, note: 'Video content outperforms text 4x on engagement' },
  channelPerformance: { instagram: { reach: 28000, engagement: '6.1%' }, linkedin: { reach: 15000, engagement: '3.8%' }, twitter: { reach: 8000, engagement: '1.2%' } },
  audienceSegments: [
    { segment: 'CFOs / Finance Leaders', size: '35%', engagement: 'high', preferredFormat: 'long-form reports, video case studies' },
    { segment: 'IT Decision Makers', size: '28%', engagement: 'medium', preferredFormat: 'technical blogs, comparison guides' },
    { segment: 'SMB Owners', size: '37%', engagement: 'low', preferredFormat: 'short videos, infographics' }
  ]
};

function StrategyForm({ handleRun, running }) {
  const [context, setContext] = useState('');
  const [analyticsData, setAnalyticsData] = useState('');
  const [useScenario, setUseScenario] = useState(false);

  function onRun(e) {
    e.preventDefault();
    if (!context.trim() && !analyticsData.trim()) {
      alert('Please enter context or analytics data.');
      return;
    }
    let parsedData = {};
    if (useScenario) parsedData = SAMPLE_DATA;
    else {
      try { parsedData = analyticsData ? JSON.parse(analyticsData) : {}; }
      catch { parsedData = { rawData: analyticsData }; }
    }
    handleRun(
      { content: context || 'Analyze the provided analytics data and recommend a content strategy pivot.', text: context },
      { analyticsData: parsedData }
    );
  }

  return (
    <form onSubmit={onRun} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Business Context <span className="text-red-400">*</span></label>
        <textarea
          className="input-field min-h-[100px] resize-none text-sm"
          placeholder="Describe your current situation, goals, and what you're trying to achieve...

e.g. 'We're a B2B fintech company targeting CFOs. Our blog content isn't getting traction. We need to pivot our content strategy to drive more enterprise leads.'"
          value={context}
          onChange={e => setContext(e.target.value)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-gray-300">Analytics Data (JSON)</label>
          <button
            type="button"
            onClick={() => { setUseScenario(s => !s); setAnalyticsData(JSON.stringify(SAMPLE_DATA, null, 2)); }}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {useScenario ? '✓ Scenario loaded' : '← Load demo scenario'}
          </button>
        </div>
        <textarea
          className="input-field min-h-[120px] resize-none text-xs font-mono"
          placeholder={`Paste your engagement data as JSON, e.g.:
{
  "videoEngagement": "8.2%",
  "textEngagement": "1.9%",
  "topChannel": "Instagram"
}`}
          value={analyticsData}
          onChange={e => { setAnalyticsData(e.target.value); setUseScenario(false); }}
        />
        <p className="text-xs text-gray-600 mt-1">If no data provided, agents will make comprehensive recommendations from context alone.</p>
      </div>

      <button type="submit" disabled={running} className="w-full btn-primary py-3 flex items-center justify-center gap-2" style={{ background: running ? undefined : 'linear-gradient(135deg, #059669, #047857)' }}>
        {running ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing Strategy...</>
        ) : '📊 Run Strategy Analysis'}
      </button>

      <div className="p-3 rounded-lg bg-white/4 border border-white/8 text-xs text-gray-500">
        <p className="font-semibold text-gray-400 mb-1">3-Agent strategy pipeline:</p>
        <p>① Analyzes performance patterns → ② Generates strategic recommendations → ③ Creates 4-week content calendar</p>
      </div>
    </form>
  );
}

export default function StrategyPivot() {
  return (
    <PipelineBase
      pipelineType="strategy_pivot"
      title="Strategy Pivot"
      icon="📊"
      description="Feed in your analytics data and business context. AI agents will identify patterns, recommend a content strategy pivot, and generate a 4-week content calendar."
      color="emerald"
      renderInputs={(props) => <StrategyForm {...props} />}
    />
  );
}
