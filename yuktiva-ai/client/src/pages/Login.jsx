import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { authApi } from '../services/api.js';
import { Zap, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let data;
      if (mode === 'login') {
        data = await authApi.login(form.email, form.password);
      } else {
        data = await authApi.register(form);
      }
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const demoAccounts = [
    { label: 'Admin', email: 'admin@yuktiva.ai', password: 'admin123', color: 'violet' },
    { label: 'User', email: 'alice@company.com', password: 'pass123', color: 'cyan' },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-700/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 mb-4 shadow-2xl shadow-violet-900/50">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Yuktiva AI</h1>
          <p className="text-gray-500 mt-1 text-sm">Multi-Agent Content Operations Platform</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl shadow-black/50">
          {/* Mode toggle */}
          <div className="flex rounded-lg bg-white/5 p-1 mb-6">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md capitalize transition-all duration-200 ${
                  mode === m ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input
                    className="input-field"
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Company</label>
                  <input
                    className="input-field"
                    placeholder="Acme Corp"
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-white/8">
            <p className="text-xs text-gray-600 text-center mb-3 uppercase tracking-wider font-medium">Quick Demo Login</p>
            <div className="flex gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.label}
                  onClick={() => setForm(f => ({ ...f, email: acc.email, password: acc.password }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    acc.color === 'violet'
                      ? 'border-violet-700/50 bg-violet-900/20 text-violet-300 hover:bg-violet-900/40'
                      : 'border-cyan-700/50 bg-cyan-900/20 text-cyan-300 hover:bg-cyan-900/40'
                  }`}
                >
                  {acc.color === 'violet' && <Shield size={12} />}
                  {acc.label}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-700 mt-2">Click a demo button then Sign In</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          ET GenAI Hackathon 2026 · Problem Statement 1 · Track: Enterprise Content Operations
        </p>
      </div>
    </div>
  );
}
