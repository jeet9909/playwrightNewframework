# Playwright TypeScript Framework
# Complete project structure with UI & API automation

## Project Structure
```
playwright-framework/
├── src/
│   ├── pages/              # Page Object Models
│   │   ├── base/
│   │   │   └── BasePage.ts
│   │   ├── LoginPage.ts
│   │   └── DashboardPage.ts
│   ├── api/                # API clients
│   │   ├── base/
│   │   │   └── BaseAPI.ts
│   │   └── UserAPI.ts
│   ├── fixtures/           # Test fixtures
│   │   └── testFixtures.ts
│   ├── utils/              # Utilities
│   │   ├── logger.ts
│   │   ├── env.ts
│   │   └── dataGenerator.ts
│   └── config/             # Configuration files
│       └── testData.ts
├── tests/
│   ├── ui/
│   │   └── login.spec.ts
│   └── api/
│       └── users.spec.ts
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

## 1. package.json
```json
{
  "name": "playwright-automation-framework",
  "version": "1.0.0",
  "description": "Scalable Playwright framework for UI and API testing",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test tests/ui",
    "test:api": "playwright test tests/api",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "report": "playwright show-report",
    "codegen": "playwright codegen"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "dotenv": "^16.3.1"
  }
}
```

## 2. tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    "paths": {
      "@pages/*": ["src/pages/*"],
      "@api/*": ["src/api/*"],
      "@utils/*": ["src/utils/*"],
      "@fixtures/*": ["src/fixtures/*"],
      "@config/*": ["src/config/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules"]
}
```

## 3. playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://example.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // DevTools enabled
    launchOptions: {
      devtools: true,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
    },
  ],
});
```

## 4. src/pages/base/BasePage.ts
```typescript
import { Page, Locator } from '@playwright/test';
import { Logger } from '@utils/logger';

export class BasePage {
  protected page: Page;
  protected logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger(this.constructor.name);
  }

  async navigate(url: string): Promise<void> {
    this.logger.info(`Navigating to: ${url}`);
    await this.page.goto(url);
  }

  async click(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
    this.logger.info(`Clicked element`);
  }

  async fill(locator: Locator, text: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.fill(text);
    this.logger.info(`Filled text: ${text}`);
  }

  async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible' });
    return await locator.textContent() || '';
  }

  async waitForNavigation(url?: string): Promise<void> {
    if (url) {
      await this.page.waitForURL(url);
    } else {
      await this.page.waitForLoadState('networkidle');
    }
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
```

## 5. src/pages/LoginPage.ts
```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base/BasePage';

export class LoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  async login(username: string, password: string): Promise<void> {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.loginButton);
    await this.waitForNavigation();
  }

  async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessage);
  }
}
```

## 6. src/api/base/BaseAPI.ts
```typescript
import { APIRequestContext, request } from '@playwright/test';
import { Logger } from '@utils/logger';

export class BaseAPI {
  protected apiContext!: APIRequestContext;
  protected baseURL: string;
  protected logger: Logger;
  protected headers: Record<string, string>;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.API_BASE_URL || '';
    this.logger = new Logger(this.constructor.name);
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async init(): Promise<void> {
    this.apiContext = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: this.headers
    });
  }

  async setAuthToken(token: string): Promise<void> {
    this.headers['Authorization'] = `Bearer ${token}`;
    await this.apiContext.dispose();
    await this.init();
  }

  async get(endpoint: string, params?: Record<string, any>) {
    this.logger.info(`GET request to: ${endpoint}`);
    const response = await this.apiContext.get(endpoint, { params });
    this.logger.info(`Response status: ${response.status()}`);
    return response;
  }

  async post(endpoint: string, data: any) {
    this.logger.info(`POST request to: ${endpoint}`);
    const response = await this.apiContext.post(endpoint, { data });
    this.logger.info(`Response status: ${response.status()}`);
    return response;
  }

  async put(endpoint: string, data: any) {
    this.logger.info(`PUT request to: ${endpoint}`);
    const response = await this.apiContext.put(endpoint, { data });
    this.logger.info(`Response status: ${response.status()}`);
    return response;
  }

  async delete(endpoint: string) {
    this.logger.info(`DELETE request to: ${endpoint}`);
    const response = await this.apiContext.delete(endpoint);
    this.logger.info(`Response status: ${response.status()}`);
    return response;
  }

  async dispose(): Promise<void> {
    await this.apiContext.dispose();
  }
}
```

## 7. src/api/UserAPI.ts
```typescript
import { BaseAPI } from './base/BaseAPI';

export class UserAPI extends BaseAPI {
  private readonly endpoint = '/users';

  async createUser(userData: any) {
    return await this.post(this.endpoint, userData);
  }

  async getUser(userId: string) {
    return await this.get(`${this.endpoint}/${userId}`);
  }

  async updateUser(userId: string, userData: any) {
    return await this.put(`${this.endpoint}/${userId}`, userData);
  }

  async deleteUser(userId: string) {
    return await this.delete(`${this.endpoint}/${userId}`);
  }

  async getAllUsers() {
    return await this.get(this.endpoint);
  }
}
```

## 8. src/fixtures/testFixtures.ts
```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { UserAPI } from '@api/UserAPI';

type MyFixtures = {
  loginPage: LoginPage;
  userAPI: UserAPI;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  
  userAPI: async ({}, use) => {
    const userAPI = new UserAPI();
    await userAPI.init();
    await use(userAPI);
    await userAPI.dispose();
  }
});

export { expect } from '@playwright/test';
```

## 9. src/utils/logger.ts
```typescript
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.context}] ${message}`;
  }

  info(message: string): void {
    console.log(this.formatMessage('INFO', message));
  }

  error(message: string): void {
    console.error(this.formatMessage('ERROR', message));
  }

  warn(message: string): void {
    console.warn(this.formatMessage('WARN', message));
  }

  debug(message: string): void {
    console.debug(this.formatMessage('DEBUG', message));
  }
}
```

## 10. src/utils/dataGenerator.ts
```typescript
export class DataGenerator {
  static randomEmail(): string {
    return `test_${Date.now()}@example.com`;
  }

  static randomString(length: number = 10): string {
    return Math.random().toString(36).substring(2, length + 2);
  }

  static randomNumber(min: number = 0, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
```

## 11. tests/ui/login.spec.ts
```typescript
import { test, expect } from '@fixtures/testFixtures';

test.describe('Login Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login successfully with valid credentials', async ({ loginPage }) => {
    await loginPage.login('testuser', 'password123');
    await expect(loginPage['page']).toHaveURL(/dashboard/);
  });

  test('should show error with invalid credentials', async ({ loginPage }) => {
    await loginPage.login('invalid', 'invalid');
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Invalid credentials');
  });
});
```

## 12. tests/api/users.api.spec.ts
```typescript
import { test, expect } from '@fixtures/testFixtures';
import { DataGenerator } from '@utils/dataGenerator';

test.describe('User API Tests', () => {
  test('should create a new user', async ({ userAPI }) => {
    const userData = {
      name: 'Test User',
      email: DataGenerator.randomEmail(),
      age: DataGenerator.randomNumber(18, 80)
    };

    const response = await userAPI.createUser(userData);
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body.email).toBe(userData.email);
  });

  test('should get user by ID', async ({ userAPI }) => {
    const response = await userAPI.getUser('1');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('id');
  });

  test('should update user', async ({ userAPI }) => {
    const updateData = {
      name: 'Updated Name'
    };

    const response = await userAPI.updateUser('1', updateData);
    expect(response.status()).toBe(200);
  });
});
```

## 13. .env (example)
```
BASE_URL=https://your-app.com
API_BASE_URL=https://api.your-app.com
USERNAME=testuser
PASSWORD=testpass
```

## Setup Instructions:
1. `npm install`
2. Create `.env` file with your configuration
3. Run tests: `npm test`
4. Run with DevTools: `npm run test:headed`
5. Debug mode: `npm run test:debug`

## Key Features:
✅ Page Object Model (POM)
✅ API & UI testing in one project
✅ TypeScript with strict typing
✅ Custom fixtures for reusability
✅ Logger utility
✅ Data generators
✅ DevTools enabled
✅ Multi-browser support
✅ Scalable structure
✅ Environment configuration