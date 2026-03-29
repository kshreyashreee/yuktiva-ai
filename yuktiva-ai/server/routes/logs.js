const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');
const { getLogBuffer, clearLogBuffer } = require('../utils/logger');

const LOG_FILE = path.join(__dirname, '../data/logs/system.log');

// GET /api/logs - get in-memory log buffer
router.get('/', authMiddleware, (req, res) => {
  const logs = getLogBuffer();
  const level = req.query.level;
  const search = req.query.search?.toLowerCase();
  const limit = parseInt(req.query.limit) || 500;
  
  let filtered = logs;
  if (level && level !== 'all') filtered = filtered.filter(l => l.level === level);
  if (search) filtered = filtered.filter(l => l.message.toLowerCase().includes(search));
  
  res.json({ logs: filtered.slice(-limit).reverse() });
});

// GET /api/logs/download - download full log file
router.get('/download', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  
  if (!fs.existsSync(LOG_FILE)) {
    return res.status(404).json({ error: 'Log file not found' });
  }
  
  const apiKey = process.env.GROQ_API_KEY;
  const maskedKey = apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : 'NOT_SET';
  
  // Prepend system info header
  const header = `# Yuktiva AI System Log
# Generated: ${new Date().toISOString()}
# Server: ${process.env.NODE_ENV || 'development'}
# GROQ_API_KEY: ${maskedKey}
# ==========================================\n\n`;
  
  const logContent = fs.readFileSync(LOG_FILE, 'utf-8');
  
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="yuktiva-system-${Date.now()}.log"`);
  res.send(header + logContent);
});

// DELETE /api/logs/clear
router.delete('/clear', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  clearLogBuffer();
  res.json({ success: true });
});

// SSE endpoint for live logs
router.get('/stream', authMiddleware, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Log stream connected' })}\n\n`);
  
  // Send initial logs
  const initialLogs = getLogBuffer().slice(-50);
  res.write(`data: ${JSON.stringify({ type: 'batch', logs: initialLogs })}\n\n`);
  
  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);
  
  req.on('close', () => clearInterval(heartbeat));
});

module.exports = router;
