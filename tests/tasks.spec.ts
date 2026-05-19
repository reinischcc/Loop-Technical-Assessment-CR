import { test, expect, Page } from '@playwright/test';
import testData from './testData.json';
 
const { credentials, testCases } = testData;
 
/**
 * Logs in to the demo app using the provided credentials.
 */
async function login(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel(/username/i).fill(credentials.email);
  await page.getByLabel(/password/i).fill(credentials.password);
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();
  // Wait until we land on the main dashboard
  await page.waitForURL(/\/(dashboard|home|app|$)/, { timeout: 10_000 }).catch(() => {
    // Some SPAs don't change the URL; just wait for the sidebar to appear
  });
  await expect(page.getByText(/Web Application|Mobile Application/i).first()).toBeVisible({ timeout: 10_000 });
}
 
/**
 * Navigates to a project by clicking its name in the sidebar.
 */
async function navigateToProject(page: Page, projectName: string): Promise<void> {
    await page.getByText(projectName, { exact: true }).first().click();
    await expect(page.locator('h1').filter({ hasText: projectName })).toBeVisible({ timeout: 8_000 });
  }
 
/**
 * Finds the kanban column that contains the given column header text,
 * then asserts that the task card exists inside it and that every
 * expected tag is visible on that card.
 */
async function verifyTaskInColumn(
    page: Page,
    taskName: string,
    columnName: string,
    expectedTags: string[]
  ): Promise<void> {
    // Find the column by its text content e.g. "To Do (2)"
    const columnContainer = page.locator('div').filter({
      has: page.locator('h2').filter({ hasText: columnName })
    }).first();
   
    await expect(columnContainer).toBeVisible({ timeout: 8_000 });
  
    // Task must be inside this column
    await expect(columnContainer.getByText(taskName, { exact: true })).toBeVisible({ timeout: 8_000 });
  
    // All tags must be inside this column
    for (const tag of expectedTags) {
      await expect(columnContainer.getByText(tag, { exact: true }).first()).toBeVisible({ timeout: 8_000 });
    }
  }
 
// ---------------------------------------------------------------------------
// Data-driven test loop — one Playwright test per entry in testData.json
// ---------------------------------------------------------------------------
for (const tc of testCases) {
  test(`TC${tc.id}: [${tc.project}] "${tc.task}" → ${tc.column} | tags: ${tc.tags.join(', ')}`, async ({ page }) => {
    // Step 1 – Login
    await login(page);
 
    // Step 2 – Navigate to the target project
    await navigateToProject(page, tc.project);
 
    // Step 3 – Verify task placement and tags
    await verifyTaskInColumn(page, tc.task, tc.column, tc.tags);
  });
}
