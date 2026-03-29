import React, { useState, useEffect, useRef } from 'react';
import { logsApi } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Download, Trash2, RefreshCw, Search, Filter, Activity } from 'lucide-react';

const LEVELS = ['all', 'info', 'warn', 'error', 'agent'];

const levelColors = {
  info: 'text-blue-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  agent: 'text-violet-400',
  debug: 'text-gray-500',
};
const levelBg = {
  info: 'bg-blue-900/20 border-blue-700/30',
  warn: 'bg-amber-900/20 border-amber-700/30',
  error: 'bg-red-900/20 border-red-700/30',
  agent: 'bg-violet-900/20 border-violet-700/30',
};

function LogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);
  const hasMeta = log.meta && Object.keys(log.meta).length > 0;
  return (
    <div className={`font-mono text-xs border rounded-lg overflow-hidden ${levelBg[log.level] || 'bg-white/3 border-white/8'}`}>
      <div className="flex items-start gap-3 p-2.5 cursor-pointer" onClick={() => hasMeta && setExpanded(s => !s)}>
        <span className="text-gray-600 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
        <span className={`font-bold uppercase flex-shrink-0 w-12 ${levelColors[log.level] || 'text-gray-400'}`}>
          {log.level?.slice(0, 5)}
        </span>
        <span className="text-gray-300 flex-1 break-all">{log.message}</span>
        {hasMeta && <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>}
      </div>
      {expanded && hasMeta && (
        <div className="px-3 pb-2.5 border-t border-white/8">
          <pre className="text-gray-500 text-xs leading-relaxed overflow-x-auto">
            {JSON.stringify(log.meta, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function SystemLogs() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { fetchLogs(); }, [level, search]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 3000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, level, search]);

  async function fetchLogs() {
    try {
      const params = { limit: 500 };
      if (level !== 'all') params.level = level;
      if (search) params.search = search;
      const data = await logsApi.get(params);
      setLogs(data.logs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function clearLogs() {
    if (!confirm('Clear all in-memory logs?')) return;
    await logsApi.clear();
    setLogs([]);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">System Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time agent activity and API call logs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(s => !s)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
              autoRefresh ? 'border-emerald-700/50 bg-emerald-900/20 text-emerald-300' : 'border-white/10 bg-white/4 text-gray-400 hover:text-white'
            }`}
          >
            <Activity size={14} className={autoRefresh ? 'animate-pulse' : ''} />
            {autoRefresh ? 'Live' : 'Auto-refresh'}
          </button>
          {isAdmin && (
            <>
              <button onClick={logsApi.downloadLog} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-white/10 bg-white/4 text-gray-400 hover:text-white transition-colors">
                <Download size={14} /> Download .log
              </button>
              <button onClick={clearLogs} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-red-700/30 bg-red-900/10 text-red-400 hover:text-red-300 transition-colors">
                <Trash2 size={14} /> Clear
              </button>
            </>
          )}
          <button onClick={fetchLogs} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input-field pl-8 py-2 text-sm"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-gray-500" />
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                level === l ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-600">{logs.length} entries</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', count: logs.length, color: 'text-white' },
          { label: 'Agent', count: logs.filter(l => l.level === 'agent').length, color: 'text-violet-400' },
          { label: 'Warnings', count: logs.filter(l => l.level === 'warn').length, color: 'text-amber-400' },
          { label: 'Errors', count: logs.filter(l => l.level === 'error').length, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="card py-3 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Log viewer */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-dark-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <span className="ml-2 text-xs text-gray-500 font-mono">yuktiva-system.log</span>
          </div>
          {autoRefresh && <span className="text-xs text-emerald-400 animate-pulse">● LIVE</span>}
        </div>

        <div className="h-[500px] overflow-y-auto p-4 space-y-2 bg-dark-900/50">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <RefreshCw size={20} className="animate-spin mr-2" /> Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <p className="font-mono text-sm">No logs found</p>
              <p className="text-xs mt-1">Run a pipeline to generate log entries</p>
            </div>
          ) : (
            logs.map((log, i) => <LogEntry key={`${log.id}-${i}`} log={log} />)
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
