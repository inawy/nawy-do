import { expect, test } from '@playwright/test';

// The appearance setting in the side menu: forced dark/light, remembered, back to automatic.
test('the theme choice applies at once and is remembered', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('html');
  await expect(root).not.toHaveAttribute('data-theme', /.+/);

  await page.getByRole('button', { name: 'القائمة الجانبية' }).click();
  await page.getByRole('radio', { name: 'داكن' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'القائمة الجانبية' }).click();
  await page.getByRole('radio', { name: 'تلقائي' }).click();
  await expect(root).not.toHaveAttribute('data-theme', /.+/);
});

// Regression: a sheet opened from the side menu must not lose its history entry (closing it then
// used to navigate away from the app).
test('closing «my data» opened from the side menu keeps the app open', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'القائمة الجانبية' }).click();
  await page.getByRole('button', { name: 'بياناتي' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'إغلاق' }).click();
  await expect(page.getByRole('button', { name: 'نية جديدة' })).toBeVisible();
  await page.goBack().catch(() => {});
  await expect(page).toHaveURL(/localhost|127\.0\.0\.1/);
});
