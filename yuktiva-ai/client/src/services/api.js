const BASE = '/api';

function getToken() {
  return localStorage.getItem('yuktiva_token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function upload(path, formData) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Upload failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  getUsers: () => request('/auth/users'),
  updateUserRole: (id, role) => request(`/auth/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
};

// Projects
export const projectsApi = {
  list: () => request('/projects'),
  get: (id) => request(`/projects/${id}`),
  create: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  approve: (projectId, runId, itemId, action, feedback) =>
    request(`/projects/${projectId}/approve/${runId}/${itemId}`, { method: 'POST', body: JSON.stringify({ action, feedback }) }),
  connectSocial: (projectId, data) =>
    request(`/projects/${projectId}/social`, { method: 'POST', body: JSON.stringify(data) }),
};

// Documents
export const documentsApi = {
  list: (projectId) => request(`/documents${projectId ? `?projectId=${projectId}` : ''}`),
  upload: (file, projectId) => {
    const fd = new FormData();
    fd.append('file', file);
    if (projectId) fd.append('projectId', projectId);
    return upload('/documents/upload', fd);
  },
  download: (id, name) => {
    const token = getToken();
    const a = document.createElement('a');
    a.href = `${BASE}/documents/${id}/download`;
    a.download = name;
    if (token) {
      // Fetch as blob since we need auth header
      fetch(`${BASE}/documents/${id}/download`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          a.href = url;
          a.click();
          URL.revokeObjectURL(url);
        });
    } else {
      a.click();
    }
  },
  delete: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  deleteBatch: (ids) => request('/documents/delete-batch', { method: 'POST', body: JSON.stringify({ ids }) }),
};

// Logs
export const logsApi = {
  get: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/logs${qs ? `?${qs}` : ''}`);
  },
  downloadLog: () => {
    const token = getToken();
    fetch(`${BASE}/logs/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yuktiva-system-${Date.now()}.log`;
        a.click();
        URL.revokeObjectURL(url);
      });
  },
  clear: () => request('/logs/clear', { method: 'DELETE' }),
};

// Pipeline — returns an EventSource for SSE streaming
export function runPipeline(payload) {
  const token = getToken();
  // We POST via fetch but read as SSE stream
  return new Promise((resolve, reject) => {
    fetch(`${BASE}/pipeline/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }).then(res => {
      if (!res.ok) return res.json().then(e => reject(new Error(e.error)));
      resolve(res);
    }).catch(reject);
  });
}

export function parsePipelineStream(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  function pump() {
    return reader.read().then(({ done, value }) => {
      if (done) { onEvent({ type: 'stream_done' }); return; }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onEvent(data);
          } catch {}
        }
      }
      return pump();
    });
  }
  
  return pump();
}
