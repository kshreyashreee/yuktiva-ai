const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { parseFile } = require('../utils/fileParser');

const DOCS_FILE = './data/documents.json';
const UPLOADS_DIR = './uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${uuidv4().slice(0, 8)}`;
    cb(null, `${unique}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt', '.md', '.csv', '.json', '.png', '.jpg', '.jpeg', '.gif', '.mp4', '.mov'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not allowed`));
  }
});

function getDocs() {
  try { return JSON.parse(fs.readFileSync(DOCS_FILE, 'utf-8')); }
  catch { return []; }
}

function saveDocs(docs) {
  fs.writeFileSync(DOCS_FILE, JSON.stringify(docs, null, 2));
}

// GET /api/documents
router.get('/', authMiddleware, (req, res) => {
  let docs = getDocs();
  if (req.user.role !== 'admin') {
    docs = docs.filter(d => d.userId === req.user.id);
  }
  if (req.query.projectId) {
    docs = docs.filter(d => d.projectId === req.query.projectId || !d.projectId);
  }
  res.json({ documents: docs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)) });
});

// POST /api/documents/upload
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    
    const parsed = await parseFile(req.file.path, req.file.mimetype);
    
    const doc = {
      id: uuidv4(),
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      extractedText: parsed.text ? parsed.text.slice(0, 50000) : '', // Store first 50k chars
      textLength: parsed.text?.length || 0,
      fileType: parsed.type,
      projectId: req.body.projectId || null,
      userId: req.user.id,
      userName: req.user.name,
      uploadedAt: new Date().toISOString()
    };
    
    const docs = getDocs();
    docs.push(doc);
    saveDocs(docs);
    
    logger.info('Document uploaded', { fileName: req.file.originalname, size: req.file.size, userId: req.user.id });
    res.status(201).json({ document: { ...doc, downloadUrl: `/uploads/${req.file.filename}` } });
  } catch (err) {
    logger.error('Upload error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id/download
router.get('/:id/download', authMiddleware, (req, res) => {
  const docs = getDocs();
  const doc = docs.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (req.user.role !== 'admin' && doc.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (!fs.existsSync(doc.filePath)) return res.status(404).json({ error: 'File not found on disk' });
  res.download(doc.filePath, doc.originalName);
});

// DELETE /api/documents/:id
router.delete('/:id', authMiddleware, (req, res) => {
  let docs = getDocs();
  const doc = docs.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (req.user.role !== 'admin' && doc.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Delete physical file
  try { if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath); } catch {}
  
  docs = docs.filter(d => d.id !== req.params.id);
  saveDocs(docs);
  logger.info('Document deleted', { fileName: doc.originalName, userId: req.user.id });
  res.json({ success: true });
});

// DELETE multiple
router.post('/delete-batch', authMiddleware, (req, res) => {
  const { ids } = req.body;
  let docs = getDocs();
  ids.forEach(id => {
    const doc = docs.find(d => d.id === id && (req.user.role === 'admin' || d.userId === req.user.id));
    if (doc) {
      try { if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath); } catch {}
    }
  });
  docs = docs.filter(d => !ids.includes(d.id) || (d.userId !== req.user.id && req.user.role !== 'admin'));
  saveDocs(docs);
  res.json({ success: true });
});

module.exports = router;
