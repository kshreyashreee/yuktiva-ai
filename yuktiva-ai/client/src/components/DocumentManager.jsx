import React, { useState, useEffect, useRef } from 'react';
import { documentsApi } from '../services/api.js';
import { Upload, File, Trash2, Download, FileText, Image, Film, X, CheckSquare, Square, RefreshCw } from 'lucide-react';

function FileIcon({ type }) {
  if (type?.includes('image')) return <Image size={16} className="text-pink-400" />;
  if (type?.includes('pdf')) return <FileText size={16} className="text-red-400" />;
  if (type?.includes('video')) return <Film size={16} className="text-blue-400" />;
  return <File size={16} className="text-gray-400" />;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentManager({ projectId, onSelect, selectable = false, selectedIds = [] }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(new Set(selectedIds));
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { fetchDocs(); }, [projectId]);

  async function fetchDocs() {
    setLoading(true);
    try {
      const data = await documentsApi.list(projectId);
      setDocs(data.documents || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleUpload(files) {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        await documentsApi.upload(file, projectId);
      } catch (e) { alert(`Upload failed: ${e.message}`); }
    }
    setUploading(false);
    fetchDocs();
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await documentsApi.delete(id);
      setDocs(d => d.filter(doc => doc.id !== id));
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
    } catch (e) { alert(e.message); }
  }

  async function handleDeleteSelected() {
    if (!selected.size || !confirm(`Delete ${selected.size} document(s)?`)) return;
    try {
      await documentsApi.deleteBatch([...selected]);
      setDocs(d => d.filter(doc => !selected.has(doc.id)));
      setSelected(new Set());
    } catch (e) { alert(e.message); }
  }

  function toggleSelect(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
    onSelect?.([...next]);
  }

  function toggleSelectAll() {
    if (selected.size === docs.length) {
      setSelected(new Set());
      onSelect?.([]);
    } else {
      const all = new Set(docs.map(d => d.id));
      setSelected(all);
      onSelect?.([...all]);
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload([...e.dataTransfer.files]); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-violet-500 bg-violet-900/20' : 'border-white/15 hover:border-violet-500/60 hover:bg-white/3'
        }`}
      >
        <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleUpload([...e.target.files])} accept=".pdf,.docx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.gif,.mp4,.mov" />
        {uploading ? (
          <div className="flex items-center justify-center gap-3 text-violet-400">
            <RefreshCw size={20} className="animate-spin" />
            <span className="font-medium">Uploading...</span>
          </div>
        ) : (
          <>
            <Upload size={28} className="mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400 font-medium">Drop files here or click to upload</p>
            <p className="text-gray-600 text-sm mt-1">PDF, DOCX, TXT, CSV, JSON, Images, Videos (max 50MB)</p>
          </>
        )}
      </div>

      {/* Toolbar */}
      {docs.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectable && (
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                {selected.size === docs.length ? <CheckSquare size={16} className="text-violet-400" /> : <Square size={16} />}
                <span>{selected.size === docs.length ? 'Deselect all' : 'Select all'}</span>
              </button>
            )}
            <span className="text-sm text-gray-500">{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button onClick={handleDeleteSelected} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-900/20 transition-all border border-red-800/30">
                <Trash2 size={14} /> Delete {selected.size}
              </button>
            )}
            <button onClick={fetchDocs} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Doc list */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading documents...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <FileText size={32} className="mx-auto mb-2 opacity-40" />
          <p>No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {docs.map(doc => (
            <div
              key={doc.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 group ${
                selected.has(doc.id) ? 'border-violet-500/50 bg-violet-900/20' : 'border-white/8 bg-white/3 hover:border-white/15'
              }`}
            >
              {selectable && (
                <button onClick={() => toggleSelect(doc.id)} className="flex-shrink-0">
                  {selected.has(doc.id)
                    ? <CheckSquare size={16} className="text-violet-400" />
                    : <Square size={16} className="text-gray-600" />
                  }
                </button>
              )}
              <FileIcon type={doc.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{doc.originalName}</p>
                <p className="text-xs text-gray-500">{formatSize(doc.size)} · {doc.fileType?.toUpperCase()} · {new Date(doc.uploadedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => documentsApi.download(doc.id, doc.originalName)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors" title="Download">
                  <Download size={14} />
                </button>
                <button onClick={() => handleDelete(doc.id, doc.originalName)} className="p-1.5 rounded hover:bg-red-900/20 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
