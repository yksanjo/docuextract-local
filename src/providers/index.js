const config = require('../config');
const LangExtractProvider = require('./LangExtractProvider');
const AWSProvider = require('./AWSProvider');
const AzureProvider = require('./AzureProvider');

/**
 * Provider Factory
 * Manages initialization and access to all document extraction providers
 */
class ProviderFactory {
  constructor() {
    this.providers = {};
    this.initializeProviders();
  }

  /**
   * Initialize all configured providers
   * @private
   */
  initializeProviders() {
    const providerConfigs = config.get('providers') || {};
    
    // Initialize LangExtract
    if (providerConfigs.langextract) {
      this.providers.langextract = new LangExtractProvider(providerConfigs.langextract);
    }
    
    // Initialize AWS Textract
    if (providerConfigs.aws) {
      this.providers.aws = new AWSProvider(providerConfigs.aws);
    }
    
    // Initialize Azure Document Intelligence
    if (providerConfigs.azure) {
      this.providers.azure = new AzureProvider(providerConfigs.azure);
    }
    
    console.log(`Initialized ${Object.keys(this.providers).length} providers`);
  }

  /**
   * Get provider by name
   * @param {string} name - Provider name
   * @returns {ProviderInterface|null}
   */
  getProvider(name) {
    return this.providers[name] || null;
  }

  /**
   * Get all enabled providers
   * @returns {Array<ProviderInterface>}
   */
  getEnabledProviders() {
    return Object.values(this.providers).filter(p => p.isEnabled());
  }

  /**
   * Get provider names
   * @returns {Array<string>}
   */
  getProviderNames() {
    return Object.keys(this.providers);
  }

  /**
   * Get health status of all providers
   * @returns {Promise<Object>}
   */
  async getHealthStatus() {
    const health = {};
    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        health[name] = {
          enabled: provider.isEnabled(),
          healthy: await provider.healthCheck(),
          pricePerPage: provider.getPricePerPage()
        };
      } catch (error) {
        health[name] = {
          enabled: provider.isEnabled(),
          healthy: false,
          error: error.message,
          pricePerPage: provider.getPricePerPage()
        };
      }
    }
    return health;
  }
}

module.exports = new ProviderFactory();
