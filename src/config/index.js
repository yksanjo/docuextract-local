const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Configuration Manager
 * Loads and manages application configuration from config.yaml
 */
class Config {
  constructor() {
    this.config = null;
    this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, '../../config.yaml');
      const fileContents = fs.readFileSync(configPath, 'utf8');
      this.config = yaml.parse(fileContents);
    } catch (error) {
      console.error('Failed to load config.yaml:', error.message);
      this.config = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      app: {
        name: 'DocuExtract Gateway',
        port: 3000,
        host: '0.0.0.0'
      },
      providers: {
        langextract: { enabled: true, pricePerPage: 0.001 },
        aws: { enabled: true, pricePerPage: 0.015 },
        azure: { enabled: true, pricePerPage: 0.005 }
      },
      routing: {
        invoice: ['azure', 'aws'],
        receipt: ['aws', 'azure'],
        form: ['azure', 'aws'],
        contract: ['langextract', 'azure'],
        id_document: ['aws', 'azure'],
        generic: ['aws', 'langextract']
      },
      volumeDiscounts: [
        { maxPages: 1000, discount: 0 },
        { maxPages: 10000, discount: 10 },
        { maxPages: 50000, discount: 20 },
        { maxPages: 100000, discount: 30 },
        { maxPages: null, discount: 40 }
      ]
    };
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    return value;
  }

  getProviderConfig(providerName) {
    return this.config.providers?.[providerName];
  }

  getRoutingProviders(documentType) {
    return this.config.routing?.[documentType] || this.config.routing?.generic || [];
  }

  getVolumeDiscount(pageCount) {
    const tiers = this.config.volumeDiscounts || [];
    for (const tier of tiers) {
      if (tier.maxPages === null || pageCount <= tier.maxPages) {
        return tier.discount;
      }
    }
    return 0;
  }

  getAllProviders() {
    return Object.entries(this.config.providers || {}).map(([name, config]) => ({
      name,
      enabled: config.enabled,
      pricePerPage: config.pricePerPage
    }));
  }
}

module.exports = new Config();
