// Process-level error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth-fixed');
const serverRoutes = require('./routes/servers');
const metricsRoutes = require('./routes/metrics');
const alertRoutes = require('./routes/alerts');
const apiKeyRoutes = require('./routes/api-keys');
const settingsRoutes = require('./routes/settings');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for proper rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting (increased for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
console.log('Mounting routes...');
const authTestRoutes = require('./routes/auth-test');
app.use('/api/v1/auth', authRoutes);
console.log('Auth routes mounted');
app.use('/api/v1/test', authTestRoutes);
console.log('Test routes mounted');
app.use('/api/v1/servers', serverRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/public', publicRoutes);
console.log('Public routes mounted');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const server = app.listen(PORT, () => {
  console.log(`Server monitoring API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
});

module.exports = app;