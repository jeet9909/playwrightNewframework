const { exec } = require('child_process');
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

async function run(cmdString, options = {}) {
  return new Promise((resolve) => {
    const proc = exec(cmdString, { maxBuffer: 1024 * 1024, ...options }, (err, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      if (err) {
        // err.code may be null in some cases
        const code = err && typeof err.code === 'number' ? err.code : 1;
        return resolve(code);
      }
      resolve(0);
    });
    // forward signals
    proc.on('exit', (code) => resolve(code || 0));
  });
}

(async function main() {
  if (!hasResults(RESULTS_DIR)) {
    console.log('No Allure results found at', RESULTS_DIR, '— skipping Allure generation.');
    return;
  }

  try {
    console.log('Generating Allure report...');
    // Prefer using the programmatic API exposed by allure-commandline to avoid shell quoting issues on Windows
    try {
      const allureCli = require('allure-commandline');
      const relResults = path.relative(process.cwd(), RESULTS_DIR) || RESULTS_DIR;
      const relOut = path.relative(process.cwd(), OUT_DIR) || OUT_DIR;
      const generation = allureCli(['generate', relResults, '-o', relOut, '--clean']);
      const genCode = await new Promise((res) => generation.on('exit', (code) => res(code)));
      if (genCode !== 0) {
        console.warn('Allure generate exited with code', genCode);
        return;
      }

      if (!process.env.CI) {
        console.log('Opening Allure report...');
        const opener = allureCli(['open', relOut]);
        await new Promise((res) => opener.on('exit', (code) => res(code)));
      } else {
        console.log('CI environment detected; skipping opening the Allure report.');
      }
    } catch (e) {
      // fallback to shell execution of npx allure if the programmatic API is unavailable
      const base = 'npx';
      const relResults = path.relative(process.cwd(), RESULTS_DIR) || RESULTS_DIR;
      const relOut = path.relative(process.cwd(), OUT_DIR) || OUT_DIR;
      const genCmd = `${base} allure generate "${relResults}" -o "${relOut}" --clean`;
      const genCode = await run(genCmd);
      if (genCode !== 0) {
        console.warn('Allure generate exited with code', genCode);
        return;
      }
      if (!process.env.CI) {
        const openCmd = `${base} allure open "${relOut}"`;
        await run(openCmd);
      }
    }
  } catch (e) {
    console.warn('Failed to generate/open Allure report:', String(e));
  }
})();
