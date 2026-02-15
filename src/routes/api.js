const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const routingEngine = require('../services/RoutingEngine');
const pricingEngine = require('../services/PricingEngine');
const providerFactory = require('../providers');
const config = require('../config');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
  }
});

/**
 * POST /extract
 * Extract text/structure from document
 */
router.post('/extract', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document provided'
      });
    }

    const { 
      documentType: requestedType, 
      clientId = 'default',
      forceProvider 
    } = req.body;

    // Get file info
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const documentBuffer = req.file.buffer;

    // Detect or use provided document type
    const documentType = requestedType || 
      routingEngine.detectDocumentType(fileName, mimeType);

    // Select provider (force if specified)
    let provider;
    if (forceProvider) {
      provider = providerFactory.getProvider(forceProvider);
      if (!provider) {
        return res.status(400).json({
          success: false,
          error: `Unknown provider: ${forceProvider}`
        });
      }
      if (!provider.isEnabled()) {
        return res.status(400).json({
          success: false,
          error: `Provider ${forceProvider} is disabled`
        });
      }
    }

    // Extract with routing
    const startTime = Date.now();
    let result;
    
    if (provider) {
      // Use specified provider directly
      result = await provider.extract(documentBuffer, fileName, mimeType);
      result._routing = {
        provider: provider.getName(),
        reason: 'forced',
        fallbackUsed: false
      };
    } else {
      // Use routing engine with fallback
      result = await routingEngine.extractWithFallback(
        documentBuffer, 
        fileName, 
        mimeType, 
        documentType
      );
    }

    const processingTime = Date.now() - startTime;
    const pageCount = result.pages?.length || 1;

    // Calculate cost
    const cost = pricingEngine.calculateCost(
      pageCount,
      result._routing.provider,
      clientId
    );

    // Record usage
    pricingEngine.recordUsage(clientId, pageCount);

    // Build response
    const response = {
      success: true,
      requestId: uuidv4(),
      documentType,
      extraction: {
        text: result.text,
        pages: result.pages,
        tables: result.tables,
        forms: result.forms
      },
      routing: result._routing,
      cost: {
        pageCount,
        baseCost: cost.baseCost,
        discountPercent: cost.discountPercent,
        discount: cost.discount,
        finalCost: cost.finalCost,
        currency: 'USD'
      },
      performance: {
        processingTimeMs: processingTime,
        provider: result._routing.provider
      },
      metadata: {
        fileName,
        mimeType,
        detectedType: documentType
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /providers
 * List available providers
 */
router.get('/providers', (req, res) => {
  try {
    const providers = config.getAllProviders();
    const routing = config.get('routing') || {};
    
    res.json({
      success: true,
      providers: providers.map(p => ({
        name: p.name,
        enabled: p.enabled,
        pricePerPage: p.pricePerPage,
        routingPriority: Object.entries(routing)
          .filter(([_, providers]) => providers.includes(p.name))
          .map(([docType]) => docType)
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /pricing
 * Get pricing information
 */
router.get('/pricing', (req, res) => {
  try {
    const tiers = pricingEngine.getPricingTiers();
    const providers = config.getAllProviders();
    
    res.json({
      success: true,
      providers: providers.map(p => ({
        name: p.name,
        pricePerPage: p.pricePerPage,
        description: getProviderDescription(p.name)
      })),
      volumeDiscounts: tiers,
      currency: 'USD'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const health = await providerFactory.getHealthStatus();
    const usage = pricingEngine.getAllUsage();
    
    const allHealthy = Object.values(health).every(h => h.healthy);
    
    res.json({
      success: true,
      status: allHealthy ? 'healthy' : 'degraded',
      providers: health,
      usage: {
        totalClients: Object.keys(usage).length,
        totalPages: Object.values(usage).reduce((sum, u) => sum + u.pages, 0)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /usage/:clientId
 * Get usage for a specific client
 */
router.get('/usage/:clientId', (req, res) => {
  try {
    const { clientId } = req.params;
    const stats = pricingEngine.getUsageStats(clientId);
    
    res.json({
      success: true,
      clientId,
      ...stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /routing/:documentType
 * Get routing info for a document type
 */
router.get('/routing/:documentType', (req, res) => {
  try {
    const { documentType } = req.params;
    const providers = config.getRoutingProviders(documentType);
    
    res.json({
      success: true,
      documentType,
      providers,
      routing: routingEngine.getRoutingInfo(documentType)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper function to get provider descriptions
 */
function getProviderDescription(name) {
  const descriptions = {
    langextract: 'Custom/local extraction service. Best for: text-heavy documents, contracts, plain PDFs. Cheapest option.',
    aws: 'Amazon Textract. Best for: receipts, invoices, fast processing. Strong table/form extraction.',
    azure: 'Azure Document Intelligence. Best for: invoices, forms, complex layouts. Excellent key-value extraction.'
  };
  return descriptions[name] || 'Document extraction provider';
}

module.exports = router;
