// Remediation Generator Module
// Creates actionable fix recommendations

import { v4 as uuidv4 } from 'uuid';

export class RemediationGenerator {
  constructor() {
    this.remediationTemplates = this.loadRemediationTemplates();
    this.complianceMappings = this.loadComplianceMappings();
  }

  loadRemediationTemplates() {
    return {
      'SQL Injection': {
        immediate: 'Implement parameterized queries (prepared statements) for all database operations',
        shortTerm: 'Add Web Application Firewall (WAF) rules to detect SQL injection patterns',
        longTerm: 'Conduct code review and implement ORM usage',
        codeSnippet: `// Use parameterized query
const query = "SELECT * FROM users WHERE id = ?";
db.execute(query, [userId]);`,
        resources: [
          'https://owasp.org/www-community/attacks/SQL_Injection',
          'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html'
        ]
      },
      'Cross-Site Scripting': {
        immediate: 'Implement output encoding for all user-supplied data',
        shortTerm: 'Add Content Security Policy (CSP) headers',
        longTerm: 'Use a modern framework with built-in XSS protection',
        codeSnippet: `// Content Security Policy header
Content-Security-Policy: default-src 'self'; script-src 'self'

// Output encoding example
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#039;");
}`,
        resources: [
          'https://owasp.org/www-community/attacks/xss/',
          'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html'
        ]
      },
      'Broken Authentication': {
        immediate: 'Implement multi-factor authentication (MFA)',
        shortTerm: 'Add rate limiting and account lockout policies',
        longTerm: 'Implement OAuth 2.0/OIDC for authentication',
        codeSnippet: `// Implement rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
});`,
        resources: [
          'https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication',
          'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html'
        ]
      },
      'Missing Security Headers': {
        immediate: 'Configure web server to include security headers',
        shortTerm: 'Implement HSTS, CSP, X-Frame-Options headers',
        longTerm: 'Use a security headers middleware library',
        codeSnippet: `// Express.js security headers
const helmet = require('helmet');
app.use(helmet());

// Custom configuration
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"]
  }
}));`,
        resources: [
          'https://securityheaders.com/',
          'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Security_Headers_Cheat_Sheet.html'
        ]
      },
      'SSH': {
        immediate: 'Disable password authentication and use SSH keys',
        shortTerm: 'Update OpenSSH to latest version',
        longTerm: 'Implement key-based authentication with passphrase',
        codeSnippet: `# /etc/ssh/sshd_config
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin no
MaxAuthTries 3
ClientAliveInterval 300`,
        resources: [
          'https://www.ssh.com/academy/ssh/sshd_config',
          'https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html'
        ]
      },
      'Redis': {
        immediate: 'Enable Redis authentication (requirepass)',
        shortTerm: 'Bind Redis to localhost only',
        longTerm: 'Implement Redis ACLs for granular access control',
        codeSnippet: `# redis.conf
requirepass your_strong_password_here
bind 127.0.0.1
protected-mode yes
rename-command FLUSHDB ""`,
        resources: [
          'https://redis.io/docs/management/security/',
          'https://github.com/antirez/redis-doc/wiki'
        ]
      },
      'MySQL': {
        immediate: 'Disable remote root login',
        shortTerm: 'Implement least privilege user grants',
        longTerm: 'Enable audit logging and monitoring',
        codeSnippet: `-- Create limited user
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON app_db.* TO 'app_user'@'localhost';

-- Disable remote root
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1');`,
        resources: [
          'https://dev.mysql.com/doc/refman/8.0/en/security-guidelines.html',
          'https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html'
        ]
      },
      'Default': {
        immediate: 'Review and harden configuration',
        shortTerm: 'Implement security best practices',
        longTerm: 'Schedule regular security audits',
        codeSnippet: null,
        resources: []
      }
    };
  }

  loadComplianceMappings() {
    return {
      SOC2: ['Access Control', 'Encryption', 'Monitoring', 'Incident Response'],
      HIPAA: ['Access Control', 'Audit Controls', 'Transmission Security'],
      PCI: ['Access Control', 'Network Security', 'Data Protection'],
      GDPR: ['Data Protection', 'Access Control', 'Breach Notification']
    };
  }

  async generate(correlationResults, scanResults) {
    console.log('\n🔧 Generating remediation recommendations...');
    
    const findings = correlationResults.findings || [];
    const remediations = [];
    
    for (const finding of findings) {
      const remediation = await this.createRemediation(finding, scanResults);
      remediations.push(remediation);
    }
    
    // Sort by priority
    const sortedRemediations = this.sortByPriority(remediations);
    
    // Group by compliance framework
    const complianceGroups = this.groupByCompliance(sortedRemediations);
    
    // Calculate total effort
    const effortEstimate = this.estimateEffort(sortedRemediations);
    
    return {
      remediationId: uuidv4(),
      timestamp: new Date().toISOString(),
      totalRemediations: sortedRemediations.length,
      remediations: sortedRemediations,
      complianceGroups,
      effortEstimate,
      summary: {
        critical: sortedRemediations.filter(r => r.severity === 'critical').length,
        high: sortedRemediations.filter(r => r.severity === 'high').length,
        medium: sortedRemediations.filter(r => r.severity === 'medium').length
      }
    };
  }

  async createRemediation(finding, scanResults) {
    await this.delay(100);
    
    const template = this.findTemplate(finding.name);
    
    return {
      id: uuidv4(),
      findingId: finding.id,
      name: finding.name || finding.ruleName,
      severity: finding.severity,
      killChainPhase: finding.killChainPhase,
      immediate: template.immediate,
      shortTerm: template.shortTerm,
      longTerm: template.longTerm,
      codeSnippet: template.codeSnippet,
      resources: template.resources,
      affectedAssets: this.getAffectedAssets(finding, scanResults),
      complianceFrameworks: this.mapToCompliance(finding),
      estimatedEffort: this.getEffortEstimate(finding.severity)
    };
  }

  findTemplate(findingName) {
    for (const [key, template] of Object.entries(this.remediationTemplates)) {
      if (findingName && findingName.toLowerCase().includes(key.toLowerCase())) {
        return template;
      }
    }
    return this.remediationTemplates['Default'];
  }

  getAffectedAssets(finding, scanResults) {
    const assets = [];
    
    if (scanResults.assets) {
      for (const asset of scanResults.assets) {
        if (finding.data?.assetId === asset.id) {
          assets.push({
            id: asset.id,
            address: asset.address,
            port: asset.port,
            service: asset.service
          });
        }
      }
    }
    
    return assets;
  }

  mapToCompliance(finding) {
    const frameworks = [];
    
    for (const [framework, controls] of Object.entries(this.complianceMappings)) {
      if (finding.severity === 'critical' || finding.severity === 'high') {
        frameworks.push({
          framework,
          controls,
          relevance: finding.severity === 'critical' ? 'High' : 'Medium'
        });
      }
    }
    
    return frameworks;
  }

  sortByPriority(remediations) {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    return remediations.sort((a, b) => {
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  groupByCompliance(remediations) {
    const groups = {};
    
    for (const remediation of remediations) {
      for (const mapping of remediation.complianceFrameworks || []) {
        const framework = mapping.framework;
        
        if (!groups[framework]) {
          groups[framework] = {
            framework,
            remediations: [],
            relevance: mapping.relevance
          };
        }
        
        groups[framework].remediations.push({
          id: remediation.id,
          name: remediation.name,
          severity: remediation.severity
        });
      }
    }
    
    return Object.values(groups);
  }

  estimateEffort(remediations) {
    let totalHours = 0;
    
    for (const remediation of remediations) {
      const effortMap = {
        critical: 8,
        high: 4,
        medium: 2,
        low: 1
      };
      
      totalHours += effortMap[remediation.severity] || 1;
    }
    
    return {
      totalHours,
      breakdown: {
        critical: remediations.filter(r => r.severity === 'critical').length * 8,
        high: remediations.filter(r => r.severity === 'high').length * 4,
        medium: remediations.filter(r => r.severity === 'medium').length * 2,
        low: remediations.filter(r => r.severity === 'low').length * 1
      }
    };
  }

  getEffortEstimate(severity) {
    const estimates = {
      critical: '8 hours',
      high: '4 hours',
      medium: '2 hours',
      low: '1 hour'
    };
    
    return estimates[severity] || '2 hours';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default RemediationGenerator;
