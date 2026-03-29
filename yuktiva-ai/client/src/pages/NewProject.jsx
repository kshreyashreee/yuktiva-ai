import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../services/api.js';
import { FolderPlus, ArrowLeft, Tag, X } from 'lucide-react';

export default function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', about: '', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput('');
  }

  function removeTag(tag) {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await projectsApi.create(form);
      navigate(`/projects/${data.project.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">New Project</h1>
          <p className="text-gray-500 text-sm">Create a workspace for your content operations</p>
        </div>
      </div>

      <div className="card space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-600/30 border border-white/10 flex items-center justify-center">
            <FolderPlus size={22} className="text-violet-400" />
          </div>
          <div>
            <h2 className="font-bold text-white">Project Details</h2>
            <p className="text-xs text-gray-500">Fill in the information about your content project</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              className="input-field text-base"
              placeholder="e.g. Q3 Product Launch Campaign"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Heading / Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Heading / Tagline</label>
            <input
              className="input-field"
              placeholder="e.g. Launching our next-gen fintech platform"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* About */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">About This Project</label>
            <textarea
              className="input-field min-h-[100px] resize-none"
              placeholder="Describe the project goal, target audience, brand context, or any relevant background information that agents should know about..."
              value={form.about}
              onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
            />
            <p className="text-xs text-gray-600 mt-1">This context will be used by AI agents to understand your project goals.</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Tags</label>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="Add a tag (e.g. fintech, b2b, launch)"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              />
              <button type="button" onClick={addTag} className="btn-secondary px-4">
                <Tag size={14} />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-900/30 border border-violet-700/40 text-violet-300 text-xs">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : '✨ Create Project'}
            </button>
          </div>
        </form>
      </div>

      {/* Info card */}
      <div className="card border-violet-800/30 bg-gradient-to-r from-violet-900/15 to-transparent">
        <h3 className="font-semibold text-white mb-2 text-sm">What happens next?</h3>
        <ul className="space-y-1.5 text-xs text-gray-500">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-violet-500 rounded-full" /> Upload product specs or other documents</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" /> Run any of the 4 AI agent pipelines</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Review generated content in the Approval Gate</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full" /> Connect social accounts and publish</li>
        </ul>
      </div>
    </div>
  );
}
