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
