#!/usr/bin/env node

/**
 * Belisasari Platform Master Startup Script for Ubuntu Server Deployment
 * Runs all services: Frontend, ElizaOS Agents, JS-Scraper services
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class BelisasariServerOrchestrator {
  constructor() {
    this.processes = new Map();
    this.isShuttingDown = false;
    this.startTime = Date.now();
    
    // Process configurations for Ubuntu server deployment
    this.configs = {
      frontend: {
        name: 'Frontend (Next.js)',
        command: 'npm',
        args: ['run', 'start'],
        cwd: path.join(__dirname, 'frontend'),
        port: parseInt(process.env.PORT) || 3000,
        color: colors.cyan,
        dependencies: [],
        env: this.getEnvVars()
      },
      elizaosAgents: {
        name: 'ElizaOS Agents (Phase 2 & 4)',
        command: 'node',
        args: ['phase2-orchestrator.js'],
        cwd: path.join(__dirname, 'elizaos-agents'),
        port: null,
        color: colors.magenta,
        dependencies: [],
        env: this.getEnvVars()
      },
      tiktokScraper: {
        name: 'TikTok Scraper',
        command: 'node',
        args: ['index.mjs'],
        cwd: path.join(__dirname, 'js-scraper'),
        port: null,
        color: colors.yellow,
        dependencies: [],
        env: this.getEnvVars()
      },
      telegramScraper: {
        name: 'Telegram Scraper',
        command: 'node',
        args: ['telegram_scraper.mjs'],
        cwd: path.join(__dirname, 'js-scraper'),
        port: null,
        color: colors.green,
        dependencies: [],
        env: this.getEnvVars()
      },
      outlightScraper: {
        name: 'Outlight Scraper',
        command: 'node',
        args: ['outlight-scraper.mjs'],
        cwd: path.join(__dirname, 'js-scraper'),
        port: null,
        color: colors.white,
        dependencies: [],
        env: this.getEnvVars()
      }
    };
  }

  // Get environment variables from root .env file
  getEnvVars() {
    return {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'production',
      HOST: process.env.HOST || '0.0.0.0'
    };
  }

  // Log with color and timestamp
  log(service, message, type = 'info') {
    const timestamp = new Date().toISOString().substr(11, 12);
    const serviceName = service ? `[${service}]` : '[ORCHESTRATOR]';
    const color = service ? this.configs[service]?.color || colors.white : colors.bright;
    
    let prefix = '';
    switch (type) {
      case 'error':
        prefix = 'Γ¥î';
        break;
      case 'warning':
        prefix = 'ΓÜá∩╕Å';
        break;
      case 'success':
        prefix = 'Γ£à';
        break;
      case 'info':
        prefix = 'Γä╣∩╕Å';
        break;
      default:
        prefix = '≡ƒô¥';
    }
    
    console.log(`${color}${prefix} ${serviceName} ${message}${colors.reset}`);
  }

  // Check if required environment variables are set
  checkEnvironment() {
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'OPENAI_API_KEY'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      this.log(null, `Missing required environment variables: ${missing.join(', ')}`, 'error');
      this.log(null, 'Please check your .env file in the root directory', 'error');
      return false;
    }

    this.log(null, 'Environment variables validated successfully', 'success');
    return true;
  }

  // Install dependencies for all services
  async installDependencies() {
    this.log(null, 'Installing dependencies for all services...', 'info');
    
    const services = ['frontend', 'elizaos-agents', 'js-scraper'];
    
    for (const service of services) {
      const servicePath = path.join(__dirname, service);
      if (fs.existsSync(servicePath)) {
        this.log(service, 'Installing dependencies...', 'info');
        try {
          await this.runCommand('npm', ['install'], servicePath);
          this.log(service, 'Dependencies installed successfully', 'success');
        } catch (error) {
          this.log(service, `Failed to install dependencies: ${error.message}`, 'error');
        }
      }
    }
  }

  // Run a command in a specific directory
  runCommand(command, args, cwd) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        cwd,
        stdio: 'pipe',
        shell: true,
        env: this.getEnvVars()
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(errorOutput || `Command failed with code ${code}`));
        }
      });
    });
  }

  // Start a single service
  async startService(serviceName) {
    const config = this.configs[serviceName];
    if (!config) {
      this.log(serviceName, 'Configuration not found', 'error');
      return false;
    }

    // Check dependencies
    for (const dep of config.dependencies) {
      if (!this.processes.has(dep)) {
        this.log(serviceName, `Waiting for dependency: ${dep}`, 'warning');
        await this.waitForService(dep);
      }
    }

    this.log(serviceName, `Starting ${config.name}...`, 'info');
    
    const childProcess = spawn(config.command, config.args, {
      cwd: config.cwd,
      stdio: 'pipe',
      shell: true,
      env: config.env
    });

    // Store process reference
    this.processes.set(serviceName, childProcess);

    // Handle process output
    childProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        this.log(serviceName, line.trim());
      });
    });

    childProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        this.log(serviceName, line.trim(), 'warning');
      });
    });

    childProcess.on('close', (code) => {
      if (!this.isShuttingDown) {
        this.log(serviceName, `Process exited with code ${code}`, code === 0 ? 'success' : 'error');
        this.processes.delete(serviceName);
      }
    });

    childProcess.on('error', (error) => {
      this.log(serviceName, `Process error: ${error.message}`, 'error');
      this.processes.delete(serviceName);
    });

    // Wait a moment for the process to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if process is still running
    if (childProcess.killed) {
      this.log(serviceName, `${config.name} failed to start`, 'error');
      return false;
    }

    this.log(serviceName, `${config.name} started successfully`, 'success');
    return true;
  }

  // Wait for a service to be ready
  async waitForService(serviceName, timeout = 30000) {
    const startTime = Date.now();
    while (!this.processes.has(serviceName) && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return this.processes.has(serviceName);
  }

  // Start all services
  async startAll() {
    this.log(null, '≡ƒÜÇ Starting Belisasari Platform on Ubuntu Server...', 'info');
    
    // Check environment
    if (!this.checkEnvironment()) {
      process.exit(1);
    }

    // Install dependencies
    await this.installDependencies();

    // Start services in order
    const serviceOrder = [
      'tiktokScraper',
      'telegramScraper',
      'outlightScraper',
      'elizaosAgents',
      'frontend'
    ];

    for (const serviceName of serviceOrder) {
      await this.startService(serviceName);
      // Small delay between service starts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.displayStatus();
  }

  // Display current status
  displayStatus() {
    console.log(`\n${colors.bright}≡ƒôè Belisasari Platform Status${colors.reset}`);
    console.log(`${colors.bright}========================${colors.reset}`);
    
    for (const [serviceName, process] of this.processes) {
      const config = this.configs[serviceName];
      const status = process && !process.killed ? '≡ƒƒó Running' : '≡ƒö┤ Stopped';
      const port = config.port ? `:${config.port}` : '';
      
      console.log(`${config.color}${status} ${config.name}${port}${colors.reset}`);
    }
    
    console.log(`\n${colors.green}≡ƒîÉ Frontend accessible at: http://YOUR_SERVER_IP:${this.configs.frontend.port}${colors.reset}`);
    console.log(`${colors.yellow}≡ƒô¥ Logs are being displayed above. Press Ctrl+C to stop all services.${colors.reset}`);
  }

  // Graceful shutdown
  async shutdown(signal) {
    this.isShuttingDown = true;
    console.log(`\n${colors.yellow}≡ƒ¢æ Received ${signal}, shutting down gracefully...${colors.reset}`);
    
    const shutdownPromises = [];
    
    for (const [serviceName, childProcess] of this.processes) {
      if (childProcess && !childProcess.killed) {
        this.log(serviceName, 'Stopping service...', 'info');
        shutdownPromises.push(
          new Promise((resolve) => {
            childProcess.on('close', () => {
              this.log(serviceName, 'Service stopped', 'success');
              resolve();
            });
            childProcess.kill(signal === 'SIGTERM' ? 'SIGTERM' : 'SIGINT');
            
            // Force kill after 5 seconds
            setTimeout(() => {
              if (!childProcess.killed) {
                childProcess.kill('SIGKILL');
                resolve();
              }
            }, 5000);
          })
        );
      }
    }

    await Promise.all(shutdownPromises);
    
    const runtime = Math.round((Date.now() - this.startTime) / 1000);
    console.log(`\n${colors.green}Γ£à Belisasari Platform stopped successfully after ${runtime} seconds${colors.reset}`);
    process.exit(0);
  }

  // Setup graceful shutdown handlers
  setupGracefulShutdown() {
    const shutdown = (signal) => {
      this.shutdown(signal);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
  }

  // Start monitoring for crashed services
  startMonitoring() {
    setInterval(() => {
      for (const [serviceName, childProcess] of this.processes) {
        if (!childProcess || childProcess.killed) {
          this.log(serviceName, 'Service stopped, attempting restart...', 'warning');
          this.startService(serviceName).catch(error => {
            this.log(serviceName, `Restart failed: ${error.message}`, 'error');
          });
        }
      }
    }, 10000); // Check every 10 seconds
  }
}

// Main execution
async function main() {
  const orchestrator = new BelisasariServerOrchestrator();
  
  try {
    orchestrator.setupGracefulShutdown();
    await orchestrator.startAll();
    orchestrator.startMonitoring();
  } catch (error) {
    console.error(`${colors.red}Γ¥î Failed to start Belisasari Platform: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}Γ¥î Uncaught Exception: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${colors.red}Γ¥î Unhandled Rejection at: ${promise}, reason: ${reason}${colors.reset}`);
  process.exit(1);
});

// Run the main function
main();
