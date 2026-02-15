// CLI Interface for Autonomous Security Copilot

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { InfrastructureScanner } from '../scanner/index.js';
import { AttackSimulationEngine } from '../attacker/index.js';
import { SignalCorrelator } from '../correlator/index.js';
import { RemediationGenerator } from '../remediation/index.js';
import { TicketManager } from '../tickets/index.js';
import { ReinforcementLearning } from '../learning/index.js';

const program = new Command();

// ASCII Art Banner
const banner = `
███████╗██╗  ██╗ ██████╗ ██╗  ██╗████████╗███████╗███╗   ██╗
██╔════╝╚██╗██╔╝██╔═══██╗██║  ██║╚══██╔══╝██╔════╝████╗  ██║
█████╗   ╚███╔╝ ██║   ██║███████║   ██║   █████╗  ██╔██╗ ██║
██╔══╝   ██╔██╗ ██║   ██║██╔══██║   ██║   ██╔══╝  ██║╚██╗██║
██║    ██╔╝ ██╗╚██████╔╝██║  ██║   ██║   ███████╗██║ ╚████║
╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝
                                                    
██████╗ ███████╗███████╗██╗     ██╗███╗   ██╗███████╗
██╔══██╗██╔════╝██╔════╝██║     ██║████╗  ██║██╔════╝
██████╔╝█████╗  █████╗  ██║     ██║██╔██╗ ██║█████╗  
██╔══██╗██╔══╝  ██╔══╝  ██║     ██║██║╚██╗██║██╔══╝  
██║  ██║███████╗██║     ███████╗██║██║ ╚████║███████╗
╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝
`;

program
  .name('security-copilot')
  .description('AI Red Team as a Service - Autonomous Security Copilot')
  .version('1.0.0');

// Full pipeline run
program
  .command('run')
  .description('Run the full security assessment pipeline')
  .option('-t, --target <target>', 'Target to scan', 'localhost')
  .option('-s, --skip-tickets', 'Skip ticket filing')
  .option('-d, --demo', 'Run in demo mode with mock data')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.yellow('═'.repeat(60)));
    console.log(chalk.green('  🤖 AI Red Team as a Service'));
    console.log(chalk.green('  📡 Autonomous Security Copilot v1.0.0'));
    console.log(chalk.yellow('═'.repeat(60)));
    
    const startTime = Date.now();
    
    try {
      // Initialize all modules
      const scanner = new InfrastructureScanner();
      const attacker = new AttackSimulationEngine();
      const correlator = new SignalCorrelator();
      const remediation = new RemediationGenerator();
      const ticketManager = new TicketManager();
      const learning = new ReinforcementLearning();
      
      // Step 1: Scan Infrastructure
      console.log(chalk.blue('\n📍 Step 1: Infrastructure Scanning'));
      console.log(chalk.gray('─'.repeat(40)));
      const scanSpinner = ora('Scanning target...').start();
      const scanResults = await scanner.scan(options.target);
      scanSpinner.succeed(`Scan complete: ${scanResults.summary.totalAssets} assets, ${scanResults.vulnerabilities.length} vulnerabilities`);
      
      // Step 2: Attack Simulation
      console.log(chalk.blue('\n📍 Step 2: Attack Simulation'));
      console.log(chalk.gray('─'.repeat(40)));
      const attackSpinner = ora('Running attack vectors...').start();
      
      // Get learning history for optimization
      const learnedParams = learning.getLearnedParameters();
      const attackResults = await attacker.runAttacks(scanResults, learnedParams.weights);
      attackSpinner.succeed(`Attacks complete: ${attackResults.successfulAttacks} successful, ${attackResults.failedAttacks} blocked`);
      
      // Step 3: Signal Correlation
      console.log(chalk.blue('\n📍 Step 3: Signal Correlation'));
      console.log(chalk.gray('─'.repeat(40)));
      const correlateSpinner = ora('Correlating findings...').start();
      const correlationResults = await correlator.correlate(scanResults, attackResults);
      correlateSpinner.succeed(`Correlation complete: ${correlationResults.findings.length} findings`);
      
      // Step 4: Remediation Generation
      console.log(chalk.blue('\n📍 Step 4: Remediation Generation'));
      console.log(chalk.gray('─'.repeat(40)));
      const remediateSpinner = ora('Generating recommendations...').start();
      const remediationResults = await remediation.generate(correlationResults, scanResults);
      remediateSpinner.succeed(`Remediations generated: ${remediationResults.totalRemediations} recommendations`);
      
      // Step 5: Ticket Filing (optional)
      let ticketResults = null;
      if (!options.skipTickets) {
        console.log(chalk.blue('\n📍 Step 5: Ticket Filing'));
        console.log(chalk.gray('─'.repeat(40)));
        const ticketSpinner = ora('Filing tickets...').start();
        ticketResults = await ticketManager.fileTickets(remediationResults, scanResults, correlationResults);
        ticketSpinner.succeed(`Tickets filed: ${ticketResults.totalTickets} tickets created`);
      }
      
      // Step 6: Reinforcement Learning
      console.log(chalk.blue('\n📍 Step 6: Learning & Optimization'));
      console.log(chalk.gray('─'.repeat(40)));
      const learnSpinner = ora('Learning from results...').start();
      const learningResults = await learning.learn(attackResults, scanResults, correlationResults);
      learnSpinner.succeed('Learning complete');
      
      // Summary
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(chalk.yellow('\n' + '═'.repeat(60)));
      console.log(chalk.green('  ✅ Security Assessment Complete'));
      console.log(chalk.yellow('═'.repeat(60)));
      
      console.log(chalk.cyan('\n📊 Results Summary:'));
      console.log(`   • Assets Scanned: ${chalk.white(scanResults.summary.totalAssets)}`);
      console.log(`   • Vulnerabilities Found: ${chalk.white(scanResults.vulnerabilities.length)}`);
      console.log(`   • Attack Vectors Tested: ${chalk.white(attackResults.totalAttacks)}`);
      console.log(`   • Successful Exploits: ${chalk.red(attackResults.successfulAttacks)}`);
      console.log(`   • Correlated Findings: ${chalk.white(correlationResults.findings.length)}`);
      console.log(`   • Risk Score: ${chalk.yellow(correlationResults.severityScores.riskScore)}/100`);
      console.log(`   • Remediation Items: ${chalk.green(remediationResults.totalRemediations)}`);
      if (ticketResults) {
        console.log(`   • Tickets Filed: ${chalk.blue(ticketResults.totalTickets)}`);
      }
      console.log(`   • Duration: ${chalk.white(duration + 's')}`);
      
      console.log(chalk.cyan('\n🧠 Learning Insights:'));
      for (const insight of learningResults.insights) {
        console.log(`   • ${insight.text}`);
      }
      
      console.log(chalk.cyan('\n📈 Model Status:'));
      const params = learning.getLearnedParameters();
      console.log(`   • Historical Records: ${chalk.white(params.historySize)}`);
      console.log(`   • Model Ready: ${params.ready ? chalk.green('Yes') : chalk.yellow('Needs more data')}`);
      
      console.log(chalk.gray('\n' + '─'.repeat(60)));
      console.log(chalk.gray('  Report generated by Autonomous Security Copilot'));
      console.log(chalk.gray('  AI Red Team as a Service'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Individual commands
program
  .command('scan')
  .description('Scan infrastructure for vulnerabilities')
  .option('-t, --target <target>', 'Target to scan', 'localhost')
  .action(async (options) => {
    console.log(chalk.cyan('🔍 Infrastructure Scanner'));
    const scanner = new InfrastructureScanner();
    const results = await scanner.scan(options.target);
    console.log(chalk.green('\n✓ Scan complete'));
    console.log(JSON.stringify(results, null, 2));
  });

program
  .command('attack')
  .description('Run attack simulation')
  .option('-t, --target <target>', 'Target to attack', 'localhost')
  .action(async (options) => {
    console.log(chalk.cyan('⚔️  Attack Simulation Engine'));
    const scanner = new InfrastructureScanner();
    const attacker = new AttackSimulationEngine();
    const scanResults = await scanner.scan(options.target);
    const results = await attacker.runAttacks(scanResults);
    console.log(chalk.green('\n✓ Attack simulation complete'));
    console.log(JSON.stringify(results, null, 2));
  });

program
  .command('correlate')
  .description('Correlate security signals')
  .action(async () => {
    console.log(chalk.cyan('🔗 Signal Correlator'));
    console.log(chalk.yellow('Run scan and attack first to generate data'));
  });

program
  .command('remediate')
  .description('Generate remediation recommendations')
  .action(async () => {
    console.log(chalk.cyan('🔧 Remediation Generator'));
    console.log(chalk.yellow('Run full pipeline first to generate data'));
  });

program
  .command('ticket')
  .description('File tickets')
  .action(async () => {
    console.log(chalk.cyan('🎫 Ticket Manager'));
    console.log(chalk.yellow('Run full pipeline first to generate data'));
  });

program
  .command('learn')
  .description('Show learning status')
  .action(async () => {
    console.log(chalk.cyan('🧠 Reinforcement Learning'));
    const learning = new ReinforcementLearning();
    const params = learning.getLearnedParameters();
    console.log(chalk.green('\n✓ Learning Status:'));
    console.log(`   • Historical Records: ${params.historySize}`);
    console.log(`   • Model Ready: ${params.ready ? 'Yes' : 'Needs more data'}`);
    console.log(`   • Attack Vector Weights:`);
    for (const [vector, weight] of Object.entries(params.weights)) {
      console.log(`     - ${vector}: ${(weight.successRate * 100).toFixed(1)}% (${weight.attempts} attempts)`);
    }
  });

program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan(banner));
  console.log(chalk.yellow('═'.repeat(60)));
  console.log(chalk.green('  🤖 AI Red Team as a Service'));
  console.log(chalk.green('  📡 Autonomous Security Copilot v1.0.0'));
  console.log(chalk.yellow('═'.repeat(60)));
  console.log(chalk.gray('\nUsage:'));
  console.log('   security-copilot run              Run full security assessment');
  console.log('   security-copilot scan              Scan infrastructure only');
  console.log('   security-copilot attack            Run attack simulation');
  console.log('   security-copilot learn             Show learning status');
  console.log(chalk.gray('\nOptions:'));
  console.log('   -t, --target <target>             Target to scan');
  console.log('   -s, --skip-tickets               Skip ticket filing');
  console.log('   -d, --demo                        Run in demo mode');
  console.log(chalk.gray('\nExamples:'));
  console.log('   security-copilot run -t 192.168.1.1');
  console.log('   security-copilot scan -t example.com');
  console.log('');
}
