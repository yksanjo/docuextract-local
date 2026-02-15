const config = require('../config');
const providerFactory = require('../providers');

/**
 * Routing Engine
 * Intelligent provider selection based on document type, cost, and availability
 */
class RoutingEngine {
  constructor() {
    this.fallbackEnabled = true;
  }

  /**
   * Select the optimal provider for a document
   * @param {string} documentType - Type of document (invoice, receipt, form, etc.)
   * @returns {Object} Selected provider and fallback list
   */
  selectProvider(documentType) {
    // Get routing priority for document type
    const providerPriority = config.getRoutingProviders(documentType);
    
    // Filter to enabled providers only
    const availableProviders = providerPriority
      .map(name => providerFactory.getProvider(name))
      .filter(p => p && p.isEnabled());

    if (availableProviders.length === 0) {
      // Fallback to any enabled provider
      const allEnabled = providerFactory.getEnabledProviders();
      if (allEnabled.length === 0) {
        throw new Error('No providers available');
      }
      return {
        provider: allEnabled[0],
        fallback: allEnabled.slice(1),
        reason: 'fallback-to-any'
      };
    }

    return {
      provider: availableProviders[0],
      fallback: availableProviders.slice(1),
      reason: 'primary'
    };
  }

  /**
   * Extract with automatic fallback on failure
   * @param {Buffer} documentBuffer - Document file buffer
   * @param {string} fileName - Original file name
   * @param {string} mimeType - MIME type
   * @param {string} documentType - Document type hint
   * @returns {Promise<Object>} Extraction result
   */
  async extractWithFallback(documentBuffer, fileName, mimeType, documentType) {
    const selection = this.selectProvider(documentType);
    let lastError = null;
    
    // Try primary provider first
    try {
      const result = await selection.provider.extract(documentBuffer, fileName, mimeType);
      return {
        ...result,
        _routing: {
          provider: selection.provider.getName(),
          reason: selection.reason,
          fallbackUsed: false
        }
      };
    } catch (error) {
      console.warn(`Primary provider ${selection.provider.getName()} failed: ${error.message}`);
      lastError = error;
    }

    // Try fallback providers
    for (const fallbackProvider of selection.fallback) {
      try {
        console.log(`Trying fallback provider: ${fallbackProvider.getName()}`);
        const result = await fallbackProvider.extract(documentBuffer, fileName, mimeType);
        return {
          ...result,
          _routing: {
            provider: fallbackProvider.getName(),
            reason: 'fallback',
            originalProvider: selection.provider.getName(),
            fallbackUsed: true
          }
        };
      } catch (error) {
        console.warn(`Fallback provider ${fallbackProvider.getName()} failed: ${error.message}`);
        lastError = error;
      }
    }

    // All providers failed
    throw new Error(`All providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Detect document type from filename or content analysis
   * @param {string} fileName - Original filename
   * @param {string} mimeType - MIME type
   * @returns {string} Detected document type
   */
  detectDocumentType(fileName, mimeType) {
    const lowerName = fileName.toLowerCase();
    
    // Check filename patterns
    if (lowerName.includes('invoice') || lowerName.includes('inv-') || lowerName.includes('bill')) {
      return 'invoice';
    }
    if (lowerName.includes('receipt') || lowerName.includes('receipt') || lowerName.includes('txn')) {
      return 'receipt';
    }
    if (lowerName.includes('form') || lowerName.includes('application') || lowerName.includes('application')) {
      return 'form';
    }
    if (lowerName.includes('contract') || lowerName.includes('agreement') || lowerName.includes('terms')) {
      return 'contract';
    }
    if (lowerName.includes('id') || lowerName.includes('passport') || lowerName.includes('license') || lowerName.includes('driver')) {
      return 'id_document';
    }
    
    // Check MIME types
    if (mimeType === 'application/pdf') {
      return 'generic';
    }
    if (mimeType.startsWith('image/')) {
      return 'generic'; // Default to generic for images
    }
    
    return 'generic';
  }

  /**
   * Get routing info for a document type
   * @param {string} documentType - Document type
   * @returns {Array<string>} Provider priority list
   */
  getRoutingInfo(documentType) {
    return config.getRoutingProviders(documentType);
  }
}

module.exports = new RoutingEngine();
