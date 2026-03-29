const express = require('express');
const router = express.Router();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const PROJECTS_FILE = './data/projects.json';

function getProjects() {
  try { return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8')); }
  catch { return []; }
}

function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

// GET /api/projects
router.get('/', authMiddleware, (req, res) => {
  let projects = getProjects();
  if (req.user.role !== 'admin') {
    projects = projects.filter(p => p.userId === req.user.id);
  }
  res.json({ projects: projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

// POST /api/projects
router.post('/', authMiddleware, (req, res) => {
  const { name, description, about, tags } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  
  const projects = getProjects();
  const project = {
    id: uuidv4(),
    name,
    description: description || '',
    about: about || '',
    tags: tags || [],
    userId: req.user.id,
    userName: req.user.name,
    userEmail: req.user.email,
    company: req.user.company,
    status: 'active',
    pipelineRuns: [],
    approvalQueue: [],
    socialAccounts: [],
    contentCalendar: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  projects.push(project);
  saveProjects(projects);
  logger.info('Project created', { projectName: name, userId: req.user.id });
  res.status(201).json({ project });
});

// GET /api/projects/:id
router.get('/:id', authMiddleware, (req, res) => {
  const projects = getProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (req.user.role !== 'admin' && project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json({ project });
});

// PUT /api/projects/:id
router.put('/:id', authMiddleware, (req, res) => {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  if (req.user.role !== 'admin' && projects[idx].userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const allowed = ['name', 'description', 'about', 'tags', 'status', 'socialAccounts', 'contentCalendar'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) projects[idx][field] = req.body[field];
  });
  projects[idx].updatedAt = new Date().toISOString();
  saveProjects(projects);
  res.json({ project: projects[idx] });
});

// DELETE /api/projects/:id
router.delete('/:id', authMiddleware, (req, res) => {
  let projects = getProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (req.user.role !== 'admin' && project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  projects = projects.filter(p => p.id !== req.params.id);
  saveProjects(projects);
  logger.info('Project deleted', { projectId: req.params.id, userId: req.user.id });
  res.json({ success: true });
});

// POST /api/projects/:id/approve/:runId/:itemId
router.post('/:id/approve/:runId/:itemId', authMiddleware, (req, res) => {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  
  const project = projects[idx];
  const runIdx = project.pipelineRuns.findIndex(r => r.id === req.params.runId);
  if (runIdx === -1) return res.status(404).json({ error: 'Pipeline run not found' });
  
  const run = project.pipelineRuns[runIdx];
  const itemIdx = run.approvalItems?.findIndex(i => i.id === req.params.itemId);
  if (itemIdx !== undefined && itemIdx > -1) {
    run.approvalItems[itemIdx].status = req.body.action === 'approve' ? 'approved' : 'rejected';
    run.approvalItems[itemIdx].feedback = req.body.feedback || '';
    run.approvalItems[itemIdx].reviewedAt = new Date().toISOString();
    run.approvalItems[itemIdx].reviewedBy = req.user.name;
  }
  
  // Check if all items reviewed
  const allReviewed = run.approvalItems?.every(i => i.status !== 'pending');
  if (allReviewed) {
    run.approvalStatus = 'completed';
    run.status = 'published';
  }
  
  project.pipelineRuns[runIdx] = run;
  projects[idx] = project;
  saveProjects(projects);
  logger.info('Content approval action', { projectId: req.params.id, action: req.body.action, item: req.params.itemId });
  res.json({ success: true, run });
});

// POST /api/projects/:id/social
router.post('/:id/social', authMiddleware, (req, res) => {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  
  const { platform, handle, connected } = req.body;
  const existing = projects[idx].socialAccounts.findIndex(s => s.platform === platform);
  if (existing > -1) {
    projects[idx].socialAccounts[existing] = { platform, handle, connected, connectedAt: new Date().toISOString() };
  } else {
    projects[idx].socialAccounts.push({ platform, handle, connected, connectedAt: new Date().toISOString() });
  }
  saveProjects(projects);
  res.json({ success: true });
});

module.exports = router;
