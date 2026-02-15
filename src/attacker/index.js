// Attack Simulation Engine Module
// Executes simulated attack vectors

import { v4 as uuidv4 } from 'uuid';

export class AttackSimulationEngine {
  constructor() {
    this.attackVectors = this.initializeAttackVectors();
    this.attackHistory = [];
  }

  initializeAttackVectors() {
    return [
      {
        id: 'owasp-1',
        name: 'SQL Injection',
        category: 'Injection',
        severity: 'critical',
        description: 'Test for SQL injection vulnerabilities',
        technique: 'T1190',
        MITRE: 'https://attack.mitre.org/techniques/T1190/'
      },
      {
        id: 'owasp-2',
        name: 'Cross-Site Scripting (XSS)',
        category: 'Injection',
        severity: 'high',
        description: 'Test for reflected and stored XSS',
        technique: 'T1189',
        MITRE: 'https://attack.mitre.org/techniques/T1189/'
      },
      {
        id: 'owasp-3',
        name: 'Broken Authentication',
        category: 'Authentication',
        severity: 'high',
        description: 'Test for weak authentication mechanisms',
        technique: 'T1078',
        MITRE: 'https://attack.mitre.org/techniques/T1078/'
      },
      {
        id: 'owasp-4',
        name: 'IDOR',
        category: 'Authorization',
        severity: 'medium',
        description: 'Test for Insecure Direct Object Reference',
        technique: 'T0822',
        MITRE: 'https://attack.mitre.org/techniques/T0822/'
      },
      {
        id: 'network-1',
        name: 'SSH Brute Force',
        category: 'Brute Force',
        severity: 'high',
        description: 'Simulate SSH credential attacks',
        technique: 'T1110',
        MITRE: 'https://attack.mitre.org/techniques/T1110/'
      },
      {
        id: 'network-2',
        name: 'Port Exploitation',
        category: 'Exploitation',
        severity: 'critical',
        description: 'Attempt exploitation of open ports',
        technique: 'T1210',
        MITRE: 'https://attack.mitre.org/techniques/T1210/'
      },
      {
        id: 'network-3',
        name: 'Lateral Movement',
        category: 'Lateral Movement',
        severity: 'critical',
        description: 'Simulate lateral movement attempts',
        technique: 'T1021',
        MITRE: 'https://attack.mitre.org/techniques/T1021/'
      },
      {
        id: 'priv-1',
        name: 'Privilege Escalation',
        category: 'Privilege Escalation',
        severity: 'critical',
        description: 'Test for privilege escalation paths',
        technique: 'T1068',
        MITRE: 'https://attack.mitre.org/techniques/T1068/'
      }
    ];
  }

  async runAttacks(scanResults, learningHistory = null) {
    console.log(`\n⚔️  Running attack simulation (${this.attackVectors.length} attack vectors)`);
    
    const results = [];
    const vulnerabilities = scanResults.vulnerabilities || [];
    
    // Filter attack vectors based on discovered services
    const relevantVectors = this.filterRelevantAttacks(vulnerabilities);
    
    for (const vector of relevantVectors) {
      const attackResult = await this.executeAttack(vector, vulnerabilities, learningHistory);
      results.push(attackResult);
      this.attackHistory.push(attackResult);
    }
    
    return {
      attackId: uuidv4(),
      timestamp: new Date().toISOString(),
      target: scanResults.target,
      totalAttacks: results.length,
      successfulAttacks: results.filter(r => r.success).length,
      failedAttacks: results.filter(r => !r.success).length,
      results
    };
  }

  filterRelevantAttacks(vulnerabilities) {
    const services = new Set(vulnerabilities.map(v => v.name.toLowerCase()));
    
    return this.attackVectors.filter(vector => {
      if (vector.name.includes('SSH') && services.has('open')) return true;
      if (vector.name.includes('SQL') || vector.name.includes('XSS')) return true;
      if (vector.name.includes('Authentication')) return true;
      if (vector.name.includes('Port')) return true;
      return true; // Include all for simulation
    });
  }

  async executeAttack(vector, vulnerabilities, learningHistory) {
    // Simulate attack execution
    await this.delay(300 + Math.random() * 500);
    
    // Use learning history to improve success probability
    let baseSuccessRate = this.getBaseSuccessRate(vector);
    if (learningHistory) {
      baseSuccessRate = this.adjustForLearning(vector, learningHistory, baseSuccessRate);
    }
    
    const success = Math.random() < baseSuccessRate;
    
    const attackResult = {
      id: uuidv4(),
      vectorId: vector.id,
      vectorName: vector.name,
      category: vector.category,
      severity: vector.severity,
      technique: vector.technique,
      success,
      timestamp: new Date().toISOString(),
      evidence: success ? this.generateEvidence(vector) : null,
      error: success ? null : this.generateError(vector),
      targetVulnerabilities: this.findRelatedVulnerabilities(vector, vulnerabilities),
      remediation: vector.severity === 'critical' ? 'Immediate action required' : 'Schedule remediation'
    };
    
    if (success) {
      console.log(`   ✓ ${vector.name} - SUCCESS`);
    } else {
      console.log(`   ✗ ${vector.name} - BLOCKED`);
    }
    
    return attackResult;
  }

  getBaseSuccessRate(vector) {
    // Base success rates by severity/attack type
    const rates = {
      'SQL Injection': 0.65,
      'Cross-Site Scripting': 0.55,
      'Broken Authentication': 0.45,
      'IDOR': 0.40,
      'SSH Brute Force': 0.35,
      'Port Exploitation': 0.50,
      'Lateral Movement': 0.30,
      'Privilege Escalation': 0.25
    };
    
    return rates[vector.name] || 0.4;
  }

  adjustForLearning(vector, history, baseRate) {
    // If history is an object (weights), use the weight directly
    if (history && typeof history === 'object' && !Array.isArray(history)) {
      if (history[vector.id]) {
        const weight = history[vector.id];
        // Blend learned success rate with base rate
        const learningWeight = Math.min(weight.attempts * 0.1, 0.5);
        return baseRate * (1 - learningWeight) + weight.successRate * learningWeight;
      }
      return baseRate;
    }
    
    // If history is an array (legacy format)
    if (Array.isArray(history)) {
      const previousAttempts = history.filter(
        h => h.vectorId === vector.id
      );
      
      if (previousAttempts.length === 0) return baseRate;
      
      // Calculate success rate from history
      const successCount = previousAttempts.filter(a => a.success).length;
      const historicalRate = successCount / previousAttempts.length;
      
      // Blend historical rate with base rate (weighted average)
      const learningWeight = Math.min(previousAttempts.length * 0.1, 0.5);
      return baseRate * (1 - learningWeight) + historicalRate * learningWeight;
    }
    
    return baseRate;
  }

  generateEvidence(vector) {
    const evidenceTemplates = {
      'SQL Injection': 'Error-based injection successful. Database version: MySQL 8.0.23',
      'Cross-Site Scripting': 'Stored XSS confirmed in comment field. Payload executed.',
      'Broken Authentication': 'Session fixation detected. Token reuse possible.',
      'IDOR': 'User ID parameter manipulable. Access to other user data confirmed.',
      'SSH Brute Force': 'Weak password combination found: admin/admin123',
      'Port Exploitation': 'Exploitable service detected on port 22',
      'Lateral Movement': 'Successfully moved to adjacent network segment',
      'Privilege Escalation': 'Sudo misconfiguration found. Root access achieved.'
    };
    
    return evidenceTemplates[vector.name] || 'Exploitation successful';
  }

  generateError(vector) {
    const errors = {
      'SQL Injection': 'Input sanitization blocked injection attempt',
      'Cross-Site Scripting': 'Content Security Policy prevented XSS',
      'Broken Authentication': 'Rate limiting and MFA blocked brute force',
      'IDOR': 'Authorization checks prevented unauthorized access',
      'SSH Brute Force': 'SSH keys required, password auth disabled',
      'Port Exploitation': 'Service properly patched and not vulnerable',
      'Lateral Movement': 'Network segmentation prevented movement',
      'Privilege Escalation': 'No exploitable misconfigurations found'
    };
    
    return errors[vector.name] || 'Attack blocked by security controls';
  }

  findRelatedVulnerabilities(vector, vulnerabilities) {
    return vulnerabilities.slice(0, 2);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAttackHistory() {
    return this.attackHistory;
  }
}

export default AttackSimulationEngine;
