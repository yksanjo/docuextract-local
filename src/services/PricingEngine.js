const config = require('../config');

/**
 * Pricing Engine
 * Manages volume discounts and cost calculations
 */
class PricingEngine {
  constructor() {
    this.usage = {}; // Track usage per client
  }

  /**
   * Calculate cost for extraction
   * @param {number} pageCount - Number of pages processed
   * @param {string} providerName - Provider used
   * @param {string} clientId - Client identifier
   * @returns {Object} Cost breakdown
   */
  calculateCost(pageCount, providerName, clientId = 'default') {
    const providerConfig = config.getProviderConfig(providerName);
    const basePrice = providerConfig?.pricePerPage || 0;
    
    // Get current monthly usage for client
    const currentUsage = this.getUsage(clientId);
    const projectedUsage = currentUsage + pageCount;
    
    // Calculate discount based on projected usage
    const discountPercent = config.getVolumeDiscount(projectedUsage);
    
    // Calculate costs
    const baseCost = basePrice * pageCount;
    const discount = baseCost * (discountPercent / 100);
    const finalCost = baseCost - discount;
    
    return {
      pageCount,
      provider: providerName,
      basePricePerPage: basePrice,
      baseCost,
      discountPercent,
      discount,
      finalCost,
      projectedUsage,
      discountTier: this.getDiscountTier(projectedUsage)
    };
  }

  /**
   * Record usage for a client
   * @param {string} clientId - Client identifier
   * @param {number} pageCount - Pages to add
   * @returns {number} Updated usage count
   */
  recordUsage(clientId, pageCount) {
    if (!this.usage[clientId]) {
      this.usage[clientId] = {
        pages: 0,
        totalCost: 0,
        requests: 0,
        lastReset: new Date().toISOString()
      };
    }
    
    this.usage[clientId].pages += pageCount;
    this.usage[clientId].requests += 1;
    
    return this.usage[clientId].pages;
  }

  /**
   * Get current usage for a client
   * @param {string} clientId - Client identifier
   * @returns {number} Current page count
   */
  getUsage(clientId = 'default') {
    return this.usage[clientId]?.pages || 0;
  }

  /**
   * Get full usage stats for a client
   * @param {string} clientId - Client identifier
   * @returns {Object} Usage statistics
   */
  getUsageStats(clientId = 'default') {
    const clientUsage = this.usage[clientId];
    if (!clientUsage) {
      return {
        pages: 0,
        totalCost: 0,
        requests: 0,
        currentDiscount: 0,
        nextTierThreshold: 1000,
        nextTierDiscount: 10
      };
    }

    const currentDiscount = config.getVolumeDiscount(clientUsage.pages);
    const nextTier = this.getNextTier(clientUsage.pages);

    return {
      pages: clientUsage.pages,
      totalCost: clientUsage.totalCost,
      requests: clientUsage.requests,
      currentDiscount,
      nextTierThreshold: nextTier?.maxPages || null,
      nextTierDiscount: nextTier?.discount || 0,
      progressToNextTier: this.calculateProgress(clientUsage.pages, nextTier?.maxPages)
    };
  }

  /**
   * Get discount tier information
   * @private
   */
  getDiscountTier(pageCount) {
    const tiers = config.get('volumeDiscounts') || [];
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (tiers[i].maxPages === null || pageCount <= tiers[i].maxPages) {
        return {
          tier: i + 1,
          maxPages: tiers[i].maxPages,
          discount: tiers[i].discount
        };
      }
    }
    return { tier: 1, maxPages: 1000, discount: 0 };
  }

  /**
   * Get next discount tier
   * @private
   */
  getNextTier(currentPages) {
    const tiers = config.get('volumeDiscounts') || [];
    for (const tier of tiers) {
      if (tier.maxPages !== null && currentPages < tier.maxPages) {
        return tier;
      }
    }
    return null; // Already at highest tier
  }

  /**
   * Calculate progress to next tier
   * @private
   */
  calculateProgress(currentPages, nextTierMax) {
    if (!nextTierMax) return 100;
    // Find current tier max
    const tiers = config.get('volumeDiscounts') || [];
    let currentTierMax = 0;
    for (const tier of tiers) {
      if (tier.maxPages !== null && currentPages >= tier.maxPages) {
        currentTierMax = tier.maxPages;
      }
    }
    const progress = ((currentPages - currentTierMax) / (nextTierMax - currentTierMax)) * 100;
    return Math.min(Math.round(progress), 100);
  }

  /**
   * Get all pricing tiers
   * @returns {Array<Object>}
   */
  getPricingTiers() {
    const tiers = config.get('volumeDiscounts') || [];
    const providers = config.getAllProviders();
    
    return tiers.map((tier, index) => ({
      tier: index + 1,
      maxPages: tier.maxPages,
      discount: tier.discount,
      effectivePrices: providers.reduce((acc, p) => {
        const basePrice = p.pricePerPage;
        const effectivePrice = basePrice * (1 - tier.discount / 100);
        acc[p.name] = {
          base: basePrice,
          effective: Math.round(effectivePrice * 10000) / 10000,
          savings: Math.round((basePrice - effectivePrice) * 10000) / 10000
        };
        return acc;
      }, {})
    }));
  }

  /**
   * Reset usage for a client
   * @param {string} clientId - Client identifier
   */
  resetUsage(clientId) {
    if (this.usage[clientId]) {
      this.usage[clientId] = {
        pages: 0,
        totalCost: 0,
        requests: 0,
        lastReset: new Date().toISOString()
      };
    }
  }

  /**
   * Get all clients' usage
   * @returns {Object}
   */
  getAllUsage() {
    return Object.entries(this.usage).reduce((acc, [clientId, data]) => {
      acc[clientId] = {
        pages: data.pages,
        requests: data.requests,
        totalCost: data.totalCost
      };
      return acc;
    }, {});
  }
}

module.exports = new PricingEngine();
