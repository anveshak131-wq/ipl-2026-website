import { test, expect } from '@playwright/test';

const URL = 'https://ipl-2026-website.pages.dev/wpl-admin-2026/live-score-ai';

test('live-score-ai page loads without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(URL, { waitUntil: 'networkidle' });
  // give any client scripts a moment to run
  await page.waitForTimeout(1000);

  expect(errors, `No console errors expected, found: ${errors.join('\n')}`).toEqual([]);
});
