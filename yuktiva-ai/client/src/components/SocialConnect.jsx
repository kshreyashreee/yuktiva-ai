import React, { useState } from 'react';
import { projectsApi } from '../services/api.js';
import { Instagram, Twitter, Linkedin, Globe, Link, CheckCircle, AlertCircle } from 'lucide-react';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'from-pink-600 to-purple-600', placeholder: '@yourbrand' },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter, color: 'from-sky-600 to-blue-700', placeholder: '@yourbrand' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'from-blue-700 to-blue-900', placeholder: 'company/yourcompany' },
  { id: 'website', label: 'Website / Blog', icon: Globe, color: 'from-gray-700 to-gray-900', placeholder: 'https://yourblog.com' },
];

export default function SocialConnect({ projectId, accounts = [], onUpdate }) {
  const [handles, setHandles] = useState(() => {
    const map = {};
    accounts.forEach(a => { map[a.platform] = a.handle; });
    return map;
  });
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState(() => {
    const map = {};
    accounts.forEach(a => { map[a.platform] = a.connected; });
    return map;
  });

  async function connect(platform) {
    const handle = handles[platform]?.trim();
    if (!handle) return;
    setSaving(s => ({ ...s, [platform]: true }));
    try {
      await projectsApi.connectSocial(projectId, { platform, handle, connected: true });
      setSaved(s => ({ ...s, [platform]: true }));
      onUpdate?.();
    } catch (e) { alert(e.message); }
    setSaving(s => ({ ...s, [platform]: false }));
  }

  async function disconnect(platform) {
    setSaving(s => ({ ...s, [platform]: true }));
    try {
      await projectsApi.connectSocial(projectId, { platform, handle: handles[platform], connected: false });
      setSaved(s => ({ ...s, [platform]: false }));
      onUpdate?.();
    } catch (e) { alert(e.message); }
    setSaving(s => ({ ...s, [platform]: false }));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Link size={16} className="text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Connected Social Accounts</h3>
      </div>
      <p className="text-xs text-gray-500 -mt-2 mb-4">Connect social accounts to enable direct publishing from the Approval Gate.</p>

      {PLATFORMS.map(p => {
        const isConnected = saved[p.id];
        return (
          <div key={p.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
            isConnected ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-white/10 bg-white/3'
          }`}>
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center flex-shrink-0`}>
              <p.icon size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white mb-1">{p.label}</div>
              <input
                value={handles[p.id] || ''}
                onChange={e => setHandles(h => ({ ...h, [p.id]: e.target.value }))}
                placeholder={p.placeholder}
                disabled={isConnected}
                className="w-full bg-transparent text-sm text-gray-400 placeholder-gray-600 focus:outline-none disabled:opacity-60"
              />
            </div>
            {isConnected ? (
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-400" />
                <button
                  onClick={() => disconnect(p.id)}
                  disabled={saving[p.id]}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-900/20"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect(p.id)}
                disabled={saving[p.id] || !handles[p.id]?.trim()}
                className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {saving[p.id] ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        );
      })}

      <div className="mt-3 p-3 rounded-lg border border-amber-700/30 bg-amber-900/10">
        <div className="flex items-start gap-2 text-xs text-amber-400">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <p>Social media API publishing requires OAuth tokens. For this prototype, handle fields are saved for reference. Direct API publishing requires platform-specific OAuth setup.</p>
        </div>
      </div>
    </div>
  );
}
