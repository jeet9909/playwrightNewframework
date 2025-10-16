const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.resolve(__dirname, '..', 'reports', 'allure-results');
const OUT_DIR = path.resolve(__dirname, '..', 'reports', 'allure-report');

function hasResults(dir) {
  try {
    if (!fs.existsSync(dir)) return false;
    const files = fs.readdirSync(dir);
    return files && files.length > 0;
  } catch (e) {
    return false;
  }
}

async function run(cmd, args, options = {}) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: false, ...options });
    proc.on('close', (code) => resolve(code));
  });
}

(async function main() {
  if (!hasResults(RESULTS_DIR)) {
    console.log('No Allure results found at', RESULTS_DIR, '— skipping Allure generation.');
    return;
  }

  try {
    console.log('Generating Allure report...');
    const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const genCode = await run(cmd, ['allure', 'generate', RESULTS_DIR, '-o', OUT_DIR, '--clean']);
    if (genCode !== 0) {
      console.warn('Allure generate exited with code', genCode);
      return;
    }

    if (!process.env.CI) {
      // Open the generated report locally for convenience
      console.log('Opening Allure report...');
      // spawn in detached mode so the script can exit but the server stays up if allure opens a server
      await run(cmd, ['allure', 'open', OUT_DIR]);
    } else {
      console.log('CI environment detected; skipping opening the Allure report.');
    }
  } catch (e) {
    console.warn('Failed to generate/open Allure report:', String(e));
  }
})();
