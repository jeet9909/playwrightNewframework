# Playwright TypeScript Framework (UI + API)

This repository is a Playwright + TypeScript framework scaffold for UI and API automation.

Setup
1. npm install
2. npm run install-browsers
3. Copy .env.example to .env and set values

Run
- npm test
- npm run test:ui
- npm run test:api
# APi and ui automation

Playwright project scaffold for API & UI automation.

Commands:

- npm install
- npm run install-browsers
- npm test

Allure report
--------------

This project is configured to produce Allure results under `reports/allure-results` when tests run with the `allure-playwright` reporter enabled. After `npm test` a `posttest` lifecycle script will attempt to generate the Allure HTML report in `reports/allure-report` and open it locally (when not running in CI).

Useful commands:

```powershell
# run tests (this will also generate the extent-like report)
npm test

# generate the Allure HTML report manually (if needed)
npx allure generate reports/allure-results -o reports/allure-report --clean

# open the generated Allure report
npx allure open reports/allure-report
```

CI: GitHub Actions
------------------

The included workflow `.github/workflows/allure-report.yml` runs tests and uploads the generated Allure report as a build artifact. To publish the Allure report in your CI, ensure your tests generate results into `reports/allure-results` and the workflow will package `reports/allure-report` as an artifact.

