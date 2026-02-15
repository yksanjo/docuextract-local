// Signal Correlator Module
// Aggregates and correlates security findings

import { v4 as uuidv4 } from 'uuid';

export class SignalCorrelator {
  constructor() {
    this.threatIntelligence = this.loadThreatIntelligence();
    this.correlationRules = this.initializeCorrelationRules();
  }

  loadThreatIntelligence() {
    return {
      'CVE-2020-15778': { severity: 'high', active: true },
      'CVE-2021-44228': { severity: 'critical', active: true },
      'CVE-2022-22965': { severity: 'critical', active: true },
      'CVE-2023-46805': { severity: 'high', active: true }
    };
  }

  initializeCorrelationRules() {
    return [
      {
        id: 'rule-1',
        name: 'SQL Injection + Database Access',
        pattern: ['SQL Injection', 'MySQL', 'PostgreSQL'],
        severity: 'critical',
        description: 'SQL injection leading to database compromise'
      },
      {
        id: 'rule-2',
        name: 'XSS + Session Hijacking',
        pattern: ['XSS', 'Broken Authentication'],
        severity: 'high',
        description: 'Cross-site scripting combined with auth issues'
      },
      {
        id: 'rule-3',
        name: 'SSH Brute Force + Root Access',
        pattern: ['SSH Brute Force', 'Privilege Escalation'],
        severity: 'critical',
        description: 'Successful SSH brute force leading to root access'
      },
      {
        id: 'rule-4',
        name: 'Port Exploitation + Lateral Movement',
        pattern: ['Port Exploitation', 'Lateral Movement'],
        severity: 'critical',
        description: 'Exploited service enabling lateral movement'
      }
    ];
  }

  async correlate(scanResults, attackResults) {
    console.log('\n🔗 Correlating security signals...');
    
    // Collect all signals
    const signals = this.collectSignals(scanResults, attackResults);
    
    // Match against threat intelligence
    const enrichedSignals = await this.enrichWithThreatIntel(signals);
    
    // Apply correlation rules
    const correlatedEvents = await this.applyCorrelationRules(enrichedSignals);
    
    // Calculate severity scores
    const severityScores = this.calculateSeverityScores(correlatedEvents);
    
    // Eliminate false positives
    const filteredSignals = this.eliminateFalsePositives(correlatedEvents);
    
    // Build attack chains
    const attackChains = this.buildAttackChains(filteredSignals);
    
    return {
      correlationId: uuidv4(),
      timestamp: new Date().toISOString(),
      totalSignals: signals.length,
      correlatedEvents: correlatedEvents.length,
      filteredSignals: filteredSignals.length,
      attackChains,
      severityScores,
      findings: filteredSignals,
      summary: {
        critical: filteredSignals.filter(s => s.severity === 'critical').length,
        high: filteredSignals.filter(s => s.severity === 'high').length,
        medium: filteredSignals.filter(s => s.severity === 'medium').length,
        low: filteredSignals.filter(s => s.severity === 'low').length
      }
    };
  }

  collectSignals(scanResults, attackResults) {
    const signals = [];
    
    // Add vulnerability findings from scan
    if (scanResults.vulnerabilities) {
      for (const vuln of scanResults.vulnerabilities) {
        signals.push({
          id: uuidv4(),
          type: 'vulnerability',
          source: 'scanner',
          name: vuln.name,
          description: vuln.description,
          severity: vuln.severity,
          cvss: vuln.cvss,
          cve: vuln.cve,
          timestamp: scanResults.timestamp,
          data: vuln
        });
      }
    }
    
    // Add attack findings
    if (attackResults.results) {
      for (const attack of attackResults.results) {
        signals.push({
          id: uuidv4(),
          type: 'attack',
          source: 'attacker',
          name: attack.vectorName,
          description: attack.success ? attack.evidence : attack.error,
          severity: attack.severity,
          success: attack.success,
          technique: attack.technique,
          timestamp: attack.timestamp,
          data: attack
        });
      }
    }
    
    return signals;
  }

  async enrichWithThreatIntel(signals) {
    await this.delay(200);
    
    return signals.map(signal => {
      const cve = signal.cve || signal.data?.cve;
      if (cve && this.threatIntelligence[cve]) {
        const intel = this.threatIntelligence[cve];
        return {
          ...signal,
          threatIntel: intel,
          severity: intel.severity === 'critical' ? 'critical' : signal.severity
        };
      }
      return signal;
    });
  }

  async applyCorrelationRules(signals) {
    await this.delay(150);
    
    const correlatedEvents = [];
    const matchedPatterns = new Set();
    
    for (const rule of this.correlationRules) {
      const matchedSignals = signals.filter(signal => 
        rule.pattern.some(pattern => signal.name.includes(pattern))
      );
      
      if (matchedSignals.length >= 2) {
        const event = {
          id: uuidv4(),
          ruleId: rule.id,
          ruleName: rule.name,
          description: rule.description,
          severity: rule.severity,
          signals: matchedSignals.map(s => s.id),
          timestamp: new Date().toISOString(),
          killChainPhase: this.determineKillChainPhase(rule.name)
        };
        
        correlatedEvents.push(event);
        
        for (const signal of matchedSignals) {
          matchedPatterns.add(signal.id);
        }
      }
    }
    
    // Add uncorrelated signals
    const uncorrelatedSignals = signals.filter(s => !matchedPatterns.has(s.id));
    for (const signal of uncorrelatedSignals) {
      correlatedEvents.push({
        id: uuidv4(),
        ruleId: null,
        ruleName: 'Single Finding',
        description: signal.description,
        severity: signal.severity,
        signals: [signal.id],
        timestamp: signal.timestamp,
        killChainPhase: this.determineKillChainPhase(signal.name)
      });
    }
    
    return correlatedEvents;
  }

  determineKillChainPhase(name) {
    const phases = {
      'SQL Injection': 'Exploitation',
      'XSS': 'Exploitation',
      'SSH Brute Force': 'Initial Access',
      'Port Exploitation': 'Exploitation',
      'Lateral Movement': 'Lateral Movement',
      'Privilege Escalation': 'Privilege Escalation'
    };
    
    for (const [key, phase] of Object.entries(phases)) {
      if (name.includes(key)) return phase;
    }
    return 'Reconnaissance';
  }

  calculateSeverityScores(events) {
    const scores = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    for (const event of events) {
      scores[event.severity]++;
    }
    
    // Calculate overall risk score (0-100)
    const riskScore = (
      events.filter(e => e.severity === 'critical').length * 25 +
      events.filter(e => e.severity === 'high').length * 10 +
      events.filter(e => e.severity === 'medium').length * 5
    );
    
    return {
      ...scores,
      riskScore: Math.min(riskScore, 100)
    };
  }

  eliminateFalsePositives(events) {
    // Simple false positive elimination rules
    return events.filter(event => {
      // Filter out low-confidence findings
      if (event.severity === 'low') {
        console.log(`   ⚠ Filtering false positive: ${event.ruleName}`);
        return false;
      }
      
      // Keep critical and high severity
      if (event.severity === 'critical' || event.severity === 'high') {
        return true;
      }
      
      // For medium, apply additional filtering
      if (event.severity === 'medium' && event.signals?.length > 1) {
        return true;
      }
      
      return false;
    });
  }

  buildAttackChains(events) {
    const chains = [];
    const criticalEvents = events.filter(e => e.severity === 'critical');
    
    if (criticalEvents.length > 0) {
      chains.push({
        id: uuidv4(),
        name: 'Critical Attack Path',
        events: criticalEvents,
        complexity: 'High',
        likelihood: 'Likely',
        description: 'Multiple critical vulnerabilities could be chained for maximum impact'
      });
    }
    
    return chains;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default SignalCorrelator;
