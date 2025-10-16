const { spawn } = require('child_process');
const path = require('path');

const playwrightCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['playwright', 'test', '-c', 'playwright.config.ts'];

console.log('Running Playwright tests...');

const child = spawn(playwrightCmd, args, { stdio: 'inherit' });

child.on('close', (code) => {
  console.log(`Playwright finished with exit code ${code}`);
  console.log('Generating extent-like report...');
    const generator = spawn(process.execPath, [path.join(__dirname, 'generate-extent-report.cjs')], { stdio: 'inherit' });
  generator.on('close', (gcode) => {
    console.log(`Report generator exited with ${gcode}`);
    process.exit(code);
  });
});
