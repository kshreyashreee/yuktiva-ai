const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '../data/logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat)
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'system.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

// In-memory log buffer for live viewing
const logBuffer = [];
const MAX_BUFFER = 1000;

const originalLog = logger.info.bind(logger);
const originalError = logger.error.bind(logger);
const originalWarn = logger.warn.bind(logger);

function addToBuffer(level, message, meta = {}) {
  const entry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    level,
    message,
    meta
  };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER) logBuffer.shift();
}

logger.info = (message, meta) => { addToBuffer('info', message, meta); originalLog(message, meta || ''); };
logger.error = (message, meta) => { addToBuffer('error', message, meta); originalError(message, meta || ''); };
logger.warn = (message, meta) => { addToBuffer('warn', message, meta); originalWarn(message, meta || ''); };

logger.agentLog = (agentName, action, details = {}) => {
  const apiKey = process.env.GROQ_API_KEY;
  const maskedKey = apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : 'NOT_SET';
  const message = `[AGENT:${agentName}] ${action}`;
  const meta = { ...details, apiKeyUsed: maskedKey, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' };
  addToBuffer('agent', message, meta);
  logger.info(message, meta);
};

function getLogBuffer() {
  return [...logBuffer];
}

function clearLogBuffer() {
  logBuffer.length = 0;
}

module.exports = { logger, getLogBuffer, clearLogBuffer };
