const express = require('express');
const config = require('./config');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DocuExtract Gateway',
    version: '1.0.0',
    description: 'Unified API for Document Extraction Services',
    endpoints: {
      extract: 'POST /api/extract - Extract text from document',
      providers: 'GET /api/providers - List available providers',
      pricing: 'GET /api/pricing - Get pricing information',
      health: 'GET /api/health - Health check',
      usage: 'GET /api/usage/:clientId - Get client usage stats',
      routing: 'GET /api/routing/:documentType - Get routing info'
    },
    providers: ['langextract', 'aws', 'azure']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
const PORT = config.get('app.port') || 3000;
const HOST = config.get('app.host') || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   DocuExtract Gateway v1.0.0                             ║
║   Unified Document Intelligence API                     ║
║                                                           ║
║   Server running on http://${HOST}:${PORT}                   ║
║                                                           ║
║   Endpoints:                                             ║
║   - POST /api/extract    Extract document text           ║
║   - GET  /api/providers  List providers                  ║
║   - GET  /api/pricing    Get pricing tiers               ║
║   - GET  /api/health     Health check                    ║
║   - GET  /api/usage/:id  Client usage stats              ║
║   - GET  /api/routing    Routing info                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
