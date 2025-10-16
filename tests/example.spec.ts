/// <reference types="@playwright/test" />
import { test, expect, Page } from '@playwright/test';

test('playwright homepage title', async ({ page }: { page: Page }) => {
  await page.goto('https://playwright.dev');
  await expect(page).toHaveTitle(/Playwright/);
});
