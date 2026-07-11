#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

console.log(`${colors.green}Starting Sales Tax Processor (Frontend + Backend)...${colors.reset}\n`);

// Start backend server
console.log(`${colors.blue}[Backend]${colors.reset} Starting FastAPI server on port 8000...`);
const backend = spawn('bash', ['-c', 'cd backend && source ../backend_env/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

// Start frontend server
console.log(`${colors.blue}[Frontend]${colors.reset} Starting Vite dev server on port 3000...\n`);
const frontend = spawn('npm', ['run', 'dev', '--workspace=frontend', '--', '--host', '0.0.0.0', '--port', '3000'], {
  cwd: __dirname,
  stdio: 'inherit',
});

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down servers...${colors.reset}`);
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
});

backend.on('error', (err) => {
  console.error(`${colors.red}Backend error:${colors.reset}`, err);
  process.exit(1);
});

frontend.on('error', (err) => {
  console.error(`${colors.red}Frontend error:${colors.reset}`, err);
  process.exit(1);
});
