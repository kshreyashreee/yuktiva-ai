import React, { useState } from 'react';
import PipelineBase from '../components/PipelineBase.jsx';

const INDUSTRIES = ['General', 'Fintech / Finance', 'Healthcare / Pharma', 'Food & Beverage', 'Legal Services', 'Real Estate', 'Education', 'Technology / SaaS'];
const SAMPLE_VIOLATIONS = `FinPay Pro is the world's #1 payment platform, guaranteed to increase your revenue by 200% in 30 days or less. Our revolutionary AI eliminates all payment fraud completely. With FinPay Pro, you'll never lose another transaction to fraud again. Join the 50,000 companies who trust us for all their financial operations. FDA-approved technology ensures your data is 100% safe and unhackable. No credit check required. Results are typical for all customers.`;

function ComplianceForm({ handleRun, running }) {
  const [content, setContent] = useState('');
  const [industry, setIndustry] = useState('General');
  const [regulations, setRegulations] = useState('');

  function onRun(e) {
    e.preventDefault();
    if (!content.trim()) { alert('Please enter content to review.'); return; }
    handleRun({ content, text: content }, { industry, regulations });
  }

  return (
    <form onSubmit={onRun} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-gray-300">Content to Review <span className="text-red-400">*</span></label>
          <button
            type="button"
            onClick={() => { setContent(SAMPLE_VIOLATIONS); setIndustry('Fintech / Finance'); }}
            className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            ← Load compliance test scenario
          </button>
        </div>
        <textarea
          className="input-field min-h-[180px] resize-none text-sm"
          placeholder="Paste the content you want to review for compliance violations...

The agent will check for:
• Unsubstantiated superlative claims ('best', 'guaranteed', '#1')
• Misleading statistics or promises
• Missing required disclaimers
• Regulatory violations (FTC, GDPR, industry-specific)
• Privacy and data handling issues"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1.5">Industry</label>
          <select className="input-field text-sm" value={industry} onChange={e => setIndustry(e.target.value)}>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1.5">Specific Regulations</label>
          <input
            className="input-field text-sm"
            placeholder="e.g. GDPR, FTC Act, HIPAA"
            value={regulations}
            onChange={e => setRegulations(e.target.value)}
          />
        </div>
      </div>

      <div className="p-3 rounded-lg bg-orange-900/15 border border-orange-700/30">
        <h4 className="text-xs font-semibold text-orange-300 mb-1">📋 Hackathon Compliance Scenario</h4>
        <p className="text-xs text-orange-400/70">Click "Load compliance test scenario" to test with a content sample containing multiple violations — including unsubstantiated claims, misleading promises, and wrong certifications.</p>
      </div>

      <button type="submit" disabled={running} className="w-full btn-primary py-3 flex items-center justify-center gap-2" style={{ background: running ? undefined : 'linear-gradient(135deg, #d97706, #b45309)' }}>
        {running ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Reviewing Compliance...</>
        ) : '🛡️ Run Compliance Review'}
      </button>

      <div className="p-3 rounded-lg bg-white/4 border border-white/8 text-xs text-gray-500">
        <p className="font-semibold text-gray-400 mb-1">3-Agent compliance pipeline:</p>
        <p>① Deep-scans for violations → ② Rewrites compliant version → ③ Generates executive audit report</p>
      </div>
    </form>
  );
}

export default function ComplianceReview() {
  return (
    <PipelineBase
      pipelineType="compliance_review"
      title="Compliance Review"
      icon="🛡️"
      description="Scan any content for regulatory violations, get flagged sentences with explanations, compliant rewrites, and an executive-ready audit report."
      color="orange"
      renderInputs={(props) => <ComplianceForm {...props} />}
    />
  );
}
