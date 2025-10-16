import { test as base, TestInfo } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { UserAPI } from '@api/UserAPI';

type MyFixtures = {
  loginPage: LoginPage;
  userAPI: UserAPI;
};

// Extend fixtures to attach video artifacts to the test results so Allure can pick them up.
// We request `testInfo` from Playwright so we can attach files produced during the run.
export const test = base.extend<MyFixtures>({
  loginPage: async ({ page, context }, use, testInfo: TestInfo) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);

    // After the test finishes, attempt to attach the recorded video (if present) to the test info.
    try {
      // page.video() exists if video recording was enabled in the config
      const video = page.video ? page.video() : undefined;
      if (video) {
        // attempt to get the video path (Playwright stores the file after the test completes)
        const videoPath = await video.path();
        if (videoPath) {
          // Attach the video so reporters (including allure-playwright) receive it
          await testInfo.attach('video', { path: videoPath, contentType: 'video/webm' });
        }
      }
    } catch (e) {
      // swallow attachment errors - don't let reporting break the test lifecycle
      // eslint-disable-next-line no-console
      console.warn('Failed to attach video for test', testInfo.title, String(e));
    }
  },
  
  userAPI: async ({}, use) => {
    const userAPI = new UserAPI();
    await userAPI.init();
    await use(userAPI);
    await userAPI.dispose();
  }
});

export { expect } from '@playwright/test';
