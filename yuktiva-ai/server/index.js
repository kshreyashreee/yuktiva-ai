require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const pipelineRoutes = require('./routes/pipeline');
const projectRoutes = require('./routes/projects');
const documentRoutes = require('./routes/documents');
const logRoutes = require('./routes/logs');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure data directories exist
['./data', './uploads'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Seed default users if not exist
const usersFile = './data/users.json';
if (!fs.existsSync(usersFile)) {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');
  const defaultUsers = [
    {
      id: uuidv4(),
      name: 'Admin User',
      email: 'admin@yuktiva.ai',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      company: 'Yuktiva AI',
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Alice Johnson',
      email: 'alice@company.com',
      password: bcrypt.hashSync('pass123', 10),
      role: 'user',
      company: 'Acme Corp',
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Bob Smith',
      email: 'bob@company.com',
      password: bcrypt.hashSync('pass123', 10),
      role: 'user',
      company: 'Acme Corp',
      createdAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
  logger.info('Default users seeded');
}

// Seed projects file if not exist
const projectsFile = './data/projects.json';
if (!fs.existsSync(projectsFile)) {
  fs.writeFileSync(projectsFile, JSON.stringify([], null, 2));
}

// Seed documents file if not exist
const docsFile = './data/documents.json';
if (!fs.existsSync(docsFile)) {
  fs.writeFileSync(docsFile, JSON.stringify([], null, 2));
}

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve built React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/logs', logRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', name: 'Yuktiva AI', timestamp: new Date().toISOString() });
});

// Catch-all for React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  logger.info(`🚀 Yuktiva AI Server running on port ${PORT}`);
  console.log(`\n🚀 Yuktiva AI Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️  WARNING: GROQ_API_KEY not set in .env file!');
  }
});

module.exports = app;
