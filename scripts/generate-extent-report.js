const fs = require('fs');
const path = require('path');

const RESULTS_JSON = path.resolve(__dirname, '..', 'test-results', 'results.json');
const RESULTS_DIR = path.resolve(__dirname, '..', 'test-results');
const OUT_DIR = path.resolve(__dirname, '..', 'reports');
const OUT_FILE = path.join(OUT_DIR, 'extent-report.html');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function collectAttachments(resultObj) {
  // Playwright attachments are stored as paths relative to outputDir in results JSON attachments arrays
  const attachments = [];
  if (!resultObj || !resultObj.suites) return attachments;
  for (const suite of resultObj.suites) {
    if (!suite.specs) continue;
    for (const spec of suite.specs) {
      if (!spec.tests) continue;
      for (const test of spec.tests) {
        for (const t of test.tests || []) {
          if (!t.results) continue;
          for (const r of t.results) {
            if (r.attachments && r.attachments.length) {
              for (const a of r.attachments) {
                attachments.push({
                  testTitle: spec.title,
                  project: r.projectName || r.projectId,
                  name: a.name,
                  path: a.path || a.body || '',
                  contentType: a.contentType || ''
                });
              }
            }
          }
        }
        // Some JSON structures include attachments directly on results objects
        for (const r of (test.results || [])) {
          if (r.attachments && r.attachments.length) {
            for (const a of r.attachments) {
              attachments.push({
                testTitle: spec.title,
                project: r.projectName || r.projectId,
                name: a.name,
                path: a.path || a.body || '',
                contentType: a.contentType || ''
              });
            }
          }
        }
      }
    }
  }
  // if no explicit attachments in JSON, scan test-results subdirectories created by Playwright
  if (fs.existsSync(RESULTS_DIR)) {
    const entries = fs.readdirSync(RESULTS_DIR, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const dirName = e.name; // example: ui-login-Login-Tests-shoul-b1b82-ully-with-valid-credentials-chromium
      const dirPath = path.join(RESULTS_DIR, dirName);

      // determine project by suffix
      const lower = dirName.toLowerCase();
      let project = '';
      for (const p of ['chromium', 'firefox', 'webkit', 'api']) {
        if (lower.endsWith(p)) { project = p; break; }
        if (lower.includes(`-${p}-`)) { project = p; break; }
      }

      // build a cleaned test title from folder name by removing known prefixes/suffixes
      let testTitle = dirName;
      // remove trailing project token
      if (project && testTitle.toLowerCase().endsWith(`-${project}`)) {
        testTitle = testTitle.slice(0, -1 * (`-${project}`).length);
      }
      // replace dashes with spaces for readability
      testTitle = testTitle.replace(/[-_]+/g, ' ');

      // look for common artifact files
      const files = fs.readdirSync(dirPath);
      for (const f of files) {
        const lf = f.toLowerCase();
        const abs = path.join(dirPath, f);
        if (lf.endsWith('.png') || lf.endsWith('.jpg') || lf.endsWith('.jpeg')) {
          attachments.push({ testTitle: testTitle.trim(), project, name: f, path: abs, contentType: 'image' });
        } else if (lf.endsWith('.webm') || lf.endsWith('.mp4')) {
          attachments.push({ testTitle: testTitle.trim(), project, name: f, path: abs, contentType: 'video' });
        } else if (lf.endsWith('.md') || lf.endsWith('.txt')) {
          attachments.push({ testTitle: testTitle.trim(), project, name: f, path: abs, contentType: 'text' });
        }
      }
    }
  }
  return attachments;
}

function generateHtml(results, attachments) {
  const title = 'Extent-like Playwright Report';
  const stats = results.stats || {};
  let html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>`;
  html += `<style>body{font-family:Arial,Helvetica,sans-serif;margin:20px}h1{color:#2c3e50}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f4f6f7} .passed{background:#eafaf1}.failed{background:#ffecec}</style>`;
  html += `</head><body><h1>${title}</h1>`;
  html += `<p>Started: ${stats.startTime || 'N/A'} — Duration(ms): ${stats.duration || 'N/A'}</p>`;

  html += `<h2>Suites</h2>`;
  for (const suite of results.suites || []) {
    html += `<h3>${suite.title} <small>${suite.file || ''}</small></h3>`;
    html += `<table><thead><tr><th>Spec</th><th>Test</th><th>Project</th><th>Status</th><th>Duration(ms)</th><th>Artifacts</th></tr></thead><tbody>`;
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        for (const r of (test.results || [])) {
          const status = r.status || 'unknown';
          const statusClass = status === 'passed' ? 'passed' : status === 'failed' ? 'failed' : '';
          const testTitle = spec.title || test.title || '';
          const proj = r.projectName || r.projectId || '';
          const dur = r.duration || '';

          // find attachments for this result
          const arts = (attachments || []).filter(a => a.testTitle === spec.title && a.project === proj);
          let artHtml = '';
          for (const a of arts) {
            const rel = path.relative(OUT_DIR, path.resolve(__dirname, '..', a.path || a.file || ''));
            if (!a.path) continue;
            const ext = path.extname(a.path).toLowerCase();
            if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || a.contentType.startsWith('image')) {
              artHtml += `<div><a href="${rel}" target="_blank">${a.name}</a> <img src="${rel}" style="max-width:200px;display:block;margin-top:5px"/></div>`;
            } else if (ext === '.webm' || ext === '.mp4' || a.contentType.startsWith('video')) {
              artHtml += `<div><a href="${rel}" target="_blank">${a.name}</a><br/><video controls style="max-width:400px"><source src="${rel}"></video></div>`;
            } else {
              artHtml += `<div><a href="${rel}" target="_blank">${a.name}</a></div>`;
            }
          }

          html += `<tr class="${statusClass}"><td>${spec.file || ''}</td><td>${testTitle}</td><td>${proj}</td><td>${status}</td><td>${dur}</td><td>${artHtml}</td></tr>`;
        }
      }
    }
    html += `</tbody></table>`;
  }

  html += `<h2>Raw JSON</h2><pre>${JSON.stringify(results, null, 2)}</pre>`;
  html += `</body></html>`;
  return html;
}

function main() {
  const results = readJson(RESULTS_JSON);
  if (!results) {
    console.warn('No results.json found at', RESULTS_JSON);
    return;
  }

  ensureDir(OUT_DIR);

  const attachments = collectAttachments(results);

  // Copy attachments into reports folder preserving relative paths if needed
  for (const a of attachments) {
    if (!a.path) continue;
    const absPath = path.isAbsolute(a.path) ? a.path : path.resolve(path.dirname(RESULTS_JSON), a.path);
    if (!fs.existsSync(absPath)) continue;
    const relTarget = path.join(OUT_DIR, path.basename(absPath));
    try {
      fs.copyFileSync(absPath, relTarget);
      // update path to point at copied location
      a.path = relTarget;
    } catch (e) {
      console.warn('Failed to copy', absPath, '->', relTarget, e.message);
    }
  }

  const html = generateHtml(results, attachments.map(a => ({...a, path: a.path}))); 
  fs.writeFileSync(OUT_FILE, html, 'utf8');
  console.log('Extent-like report generated at', OUT_FILE);
}

main();
