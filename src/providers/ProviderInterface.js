/**
 * Provider Adapter Interface
 * Defines the contract that all document extraction providers must implement
 */
class ProviderInterface {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  /**
   * Extract text/structure from document
   * @param {Buffer} documentBuffer - The document file buffer
   * @param {string} fileName - Original file name
   * @param {string} mimeType - MIME type of the document
   * @returns {Promise<Object>} Extracted content with normalized format
   */
  async extract(documentBuffer, fileName, mimeType) {
    throw new Error('Method not implemented: extract()');
  }

  /**
   * Check if provider is available
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    throw new Error('Method not implemented: healthCheck()');
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   * Get price per page
   * @returns {number}
   */
  getPricePerPage() {
    return this.config?.pricePerPage || 0;
  }

  /**
   * Check if provider is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.config?.enabled !== false;
  }

  /**
   * Normalize response to standard format
   * @param {Object} rawResponse - Provider-specific response
   * @returns {Object} Normalized response
   */
  normalizeResponse(rawResponse) {
    return {
      text: rawResponse.text || '',
      pages: rawResponse.pages || [],
      tables: rawResponse.tables || [],
      forms: rawResponse.forms || [],
      metadata: {
        provider: this.name,
        ...rawResponse.metadata
      }
    };
  }
}

module.exports = ProviderInterface;
