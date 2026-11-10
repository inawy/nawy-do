import { expect, test } from '@playwright/test';
import { chooseFromDrawer } from './menu';

// The language switch: Arabic (RTL) by default, English (LTR) on request, and the choice is kept.
test('switches to English, flips the direction, and remembers the choice', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

  await chooseFromDrawer(page, 'English');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByLabel('What do you intend to do?').fill('Call the plumber');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('Call the plumber', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByText('Call the plumber', { exact: true })).toBeVisible();

  await chooseFromDrawer(page, 'العربية');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});
