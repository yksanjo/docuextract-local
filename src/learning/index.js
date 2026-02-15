// Reinforcement Learning Module
// Learns from attack failures, improves next run

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ReinforcementLearning {
  constructor() {
    this.learningDataPath = path.join(__dirname, '../../data');
    this.learningHistory = [];
    this.modelWeights = this.initializeModelWeights();
    this.loadLearningHistory();
  }

  initializeModelWeights() {
    // Q-learning inspired weights for attack vectors
    return {
      'owasp-1': { successRate: 0.65, attempts: 20, lastSuccess: null },
      'owasp-2': { successRate: 0.55, attempts: 18, lastSuccess: null },
      'owasp-3': { successRate: 0.45, attempts: 15, lastSuccess: null },
      'owasp-4': { successRate: 0.40, attempts: 12, lastSuccess: null },
      'network-1': { successRate: 0.35, attempts: 10, lastSuccess: null },
      'network-2': { successRate: 0.50, attempts: 8, lastSuccess: null },
      'network-3': { successRate: 0.30, attempts: 5, lastSuccess: null },
      'priv-1': { successRate: 0.25, attempts: 3, lastSuccess: null }
    };
  }

  loadLearningHistory() {
    try {
      if (!fs.existsSync(this.learningDataPath)) {
        fs.mkdirSync(this.learningDataPath, { recursive: true });
      }
      
      const historyFile = path.join(this.learningDataPath, 'learning-history.json');
      if (fs.existsSync(historyFile)) {
        const data = fs.readFileSync(historyFile, 'utf-8');
        this.learningHistory = JSON.parse(data);
        console.log(`   📚 Loaded ${this.learningHistory.length} historical records`);
      }
    } catch (error) {
      console.log('   ⚠ Could not load learning history, starting fresh');
      this.learningHistory = [];
    }
  }

  saveLearningHistory() {
    try {
      const historyFile = path.join(this.learningDataPath, 'learning-history.json');
      fs.writeFileSync(historyFile, JSON.stringify(this.learningHistory, null, 2));
    } catch (error) {
      console.error('   ⚠ Could not save learning history');
    }
  }

  async learn(attackResults, scanResults, correlationResults) {
    console.log('\n🧠 Running reinforcement learning analysis...');
    
    const learningRecords = [];
    
    // Process each attack result
    for (const result of attackResults.results || []) {
      const record = await this.processAttackResult(result, scanResults, correlationResults);
      learningRecords.push(record);
    }
    
    // Update model weights based on results
    this.updateModelWeights(learningRecords);
    
    // Identify patterns and improvements
    const patterns = this.identifyPatterns();
    const improvements = this.suggestImprovements(patterns);
    
    // Save learning history
    this.learningHistory.push(...learningRecords);
    this.saveLearningHistory();
    
    return {
      learningId: uuidv4(),
      timestamp: new Date().toISOString(),
      recordsProcessed: learningRecords.length,
      modelWeights: this.modelWeights,
      patterns,
      improvements,
      insights: this.generateInsights(learningRecords, patterns)
    };
  }

  async processAttackResult(result, scanResults, correlationResults) {
    await this.delay(50);
    
    const record = {
      id: uuidv4(),
      vectorId: result.vectorId,
      vectorName: result.vectorName,
      success: result.success,
      timestamp: result.timestamp,
      target: scanResults.target,
      
      // Context features
      severity: result.severity,
      targetVulnerabilities: result.targetVulnerabilities?.length || 0,
      environmentFactors: this.extractEnvironmentFactors(scanResults),
      
      // Learning signal
      reward: this.calculateReward(result, correlationResults)
    };
    
    // Update the model's last success timestamp
    if (this.modelWeights[result.vectorId]) {
      this.modelWeights[result.vectorId].lastSuccess = result.success ? new Date().toISOString() : null;
    }
    
    console.log(`   ${result.success ? '✓' : '✗'} Learned: ${result.vectorName} - Reward: ${record.reward.toFixed(2)}`);
    
    return record;
  }

  extractEnvironmentFactors(scanResults) {
    return {
      totalAssets: scanResults.assets?.length || 0,
      totalVulnerabilities: scanResults.vulnerabilities?.length || 0,
      criticalVulnerabilities: scanResults.vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
      openPorts: scanResults.summary?.openPorts || 0
    };
  }

  calculateReward(attackResult, correlationResults) {
    let reward = 0;
    
    // Base reward for success/failure
    reward += attackResult.success ? 1.0 : -0.2;
    
    // Bonus for critical severity attacks
    if (attackResult.severity === 'critical' && attackResult.success) {
      reward += 0.5;
    }
    
    // Check if attack led to a correlated event
    const correlatedEvent = correlationResults?.findings?.find(
      f => f.name === attackResult.vectorName
    );
    
    if (correlatedEvent) {
      reward += 0.3;
    }
    
    // Penalty for repeated failures on same vector
    const previousFailures = this.learningHistory.filter(
      h => h.vectorId === attackResult.vectorId && !h.success
    ).length;
    
    if (previousFailures > 3) {
      reward -= 0.1 * (previousFailures - 3);
    }
    
    return Math.max(-1, Math.min(1.5, reward)); // Clamp between -1 and 1.5
  }

  updateModelWeights(records) {
    for (const record of records) {
      if (!this.modelWeights[record.vectorId]) {
        this.modelWeights[record.vectorId] = {
          successRate: 0.5,
          attempts: 0,
          lastSuccess: null
        };
      }
      
      const weights = this.modelWeights[record.vectorId];
      
      // Update success rate using exponential moving average
      const alpha = 0.1; // Learning rate
      weights.successRate = (1 - alpha) * weights.successRate + alpha * (record.success ? 1 : 0);
      weights.attempts++;
    }
  }

  identifyPatterns() {
    const patterns = [];
    
    // Pattern 1: Most successful attack vectors
    const sortedVectors = Object.entries(this.modelWeights)
      .sort((a, b) => b[1].successRate - a[1].successRate);
    
    if (sortedVectors.length > 0) {
      patterns.push({
        type: 'most_successful',
        vector: sortedVectors[0][0],
        successRate: sortedVectors[0][1].successRate,
        description: `${sortedVectors[0][0]} has the highest success rate`
      });
    }
    
    // Pattern 2: Failed attack vectors needing improvement
    const failedVectors = sortedVectors.filter(([_, w]) => w.successRate < 0.3);
    if (failedVectors.length > 0) {
      patterns.push({
        type: 'needs_improvement',
        vectors: failedVectors.map(([k, _]) => k),
        description: `${failedVectors.length} attack vectors have low success rates`
      });
    }
    
    // Pattern 3: Learning convergence
    const avgAttempts = Object.values(this.modelWeights)
      .reduce((sum, w) => sum + w.attempts, 0) / Object.keys(this.modelWeights).length;
    
    patterns.push({
      type: 'convergence',
      avgAttempts,
      description: avgAttempts > 10 ? 'Model is well-trained' : 'Model needs more data'
    });
    
    return patterns;
  }

  suggestImprovements(patterns) {
    const improvements = [];
    
    for (const pattern of patterns) {
      if (pattern.type === 'needs_improvement') {
        for (const vectorId of pattern.vectors) {
          improvements.push({
            type: 'strategy_adjustment',
            vectorId,
            suggestion: `Consider modifying attack parameters for ${vectorId}`,
            reason: 'Low success rate indicates possible defensive measures',
            action: 'Adjust attack intensity or try alternative vectors'
          });
        }
      }
      
      if (pattern.type === 'most_successful') {
        improvements.push({
          type: 'focus_area',
          vectorId: pattern.vector,
          suggestion: `Prioritize ${pattern.vector} in future scans`,
          reason: 'High success rate makes it reliable for finding issues',
          action: 'Use as primary discovery vector'
        });
      }
    }
    
    // General improvements
    improvements.push({
      type: 'general',
      suggestion: 'Run more attack simulations to improve model accuracy',
      reason: 'Learning model benefits from more data points',
      action: 'Schedule regular automated scans'
    });
    
    return improvements;
  }

  generateInsights(records, patterns) {
    const insights = [];
    
    const totalRecords = records.length;
    const successfulRecords = records.filter(r => r.success).length;
    const successRate = totalRecords > 0 ? successfulRecords / totalRecords : 0;
    
    insights.push({
      category: 'performance',
      text: `Attack success rate: ${(successRate * 100).toFixed(1)}%`
    });
    
    const avgReward = records.reduce((sum, r) => sum + r.reward, 0) / totalRecords;
    insights.push({
      category: 'learning',
      text: `Average learning reward: ${avgReward.toFixed(2)}`
    });
    
    const criticalSuccess = records.filter(r => r.severity === 'critical' && r.success).length;
    if (criticalSuccess > 0) {
      insights.push({
        category: 'impact',
        text: `Successfully exploited ${criticalSuccess} critical vulnerabilities`
      });
    }
    
    return insights;
  }

  // Get learned parameters for attack optimization
  getLearnedParameters() {
    return {
      weights: this.modelWeights,
      historySize: this.learningHistory.length,
      ready: this.learningHistory.length >= 10
    };
  }

  // Reset learning history (for testing)
  reset() {
    this.learningHistory = [];
    this.modelWeights = this.initializeModelWeights();
    this.saveLearningHistory();
    console.log('   🔄 Learning history reset');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Make attackResults available in scope
let attackResults;

export default ReinforcementLearning;
