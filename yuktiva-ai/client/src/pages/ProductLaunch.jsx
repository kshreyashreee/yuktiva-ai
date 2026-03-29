import React, { useState } from 'react';
import PipelineBase from '../components/PipelineBase.jsx';

const LANGUAGES = ['Tamil (India)', 'Hindi (India)', 'Spanish', 'French', 'German', 'Japanese', 'Mandarin', 'Arabic', 'Portuguese'];
const INDUSTRIES = ['General', 'Fintech', 'Healthcare', 'Technology', 'Retail / E-commerce', 'Education', 'Real Estate', 'Food & Beverage'];

function ProductLaunchForm({ handleRun, running }) {
  const [spec, setSpec] = useState('');
  const [languages, setLanguages] = useState(['Tamil (India)']);
  const [industries, setIndustries] = useState(['General']);
  const [customIndustry, setCustomIndustry] = useState('');
  const [brandGuidelines, setBrandGuidelines] = useState('');

  // ✅ Toggle helper
  const toggleItem = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter(v => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  function onRun(e) {
    e.preventDefault();

    if (!spec.trim()) {
      alert('Please enter a product specification or context.');
      return;
    }

    if (languages.length === 0) {
      alert('Select at least one language.');
      return;
    }

    if (industries.length === 0 && !customIndustry.trim()) {
      alert('Select or enter at least one industry.');
      return;
    }

    handleRun(
      { productSpec: spec, text: spec },
      {
        targetLanguages: languages,
        industries,
        customIndustry,
        brandGuidelines
      }
    );
  }

  return (
    <form onSubmit={onRun} className="space-y-4">

      {/* Product Spec */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-1.5">
          Product Specification / Context <span className="text-red-400">*</span>
        </label>
        <textarea
          className="input-field min-h-[160px] resize-none text-sm"
          placeholder="Enter product details..."
          value={spec}
          onChange={e => setSpec(e.target.value)}
        />
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Localize To (Multiple)
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <button
              type="button"
              key={lang}
              onClick={() => toggleItem(lang, languages, setLanguages)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                languages.includes(lang)
                  ? 'bg-violet-600 text-white border-violet-500'
                  : 'bg-white/5 text-gray-400 border-white/10'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Industries */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Industries (Multiple)
        </label>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map(ind => (
            <button
              type="button"
              key={ind}
              onClick={() => toggleItem(ind, industries, setIndustries)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                industries.includes(ind)
                  ? 'bg-violet-600 text-white border-violet-500'
                  : 'bg-white/5 text-gray-400 border-white/10'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Industry */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-1.5">
          Custom Industry
        </label>
        <input
          type="text"
          className="input-field text-sm"
          placeholder="e.g. EdTech, AI SaaS, Logistics"
          value={customIndustry}
          onChange={e => setCustomIndustry(e.target.value)}
        />
      </div>

      {/* Brand Guidelines */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-1.5">
          Brand Guidelines <span className="text-gray-600">(optional)</span>
        </label>
        <textarea
          className="input-field min-h-[60px] resize-none text-sm"
          placeholder="Tone, rules, restrictions..."
          value={brandGuidelines}
          onChange={e => setBrandGuidelines(e.target.value)}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={running}
        className="w-full btn-primary py-3 flex items-center justify-center gap-2"
      >
        {running ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Running Pipeline...
          </>
        ) : (
          '🚀 Run Pipeline'
        )}
      </button>

    </form>
  );
}

export default function ProductLaunch() {
  return (
    <PipelineBase
      pipelineType="product_launch"
      title="Product Launch"
      icon="🚀"
      description="Generate content for multiple languages & industries."
      color="violet"
      renderInputs={(props) => <ProductLaunchForm {...props} />}
    />
  );
}