import type { Page } from '@playwright/test';

/** Opens the «more» menu and picks an item. */
export async function chooseFromMenu(
  page: Page,
  name: string,
  role: 'menuitem' | 'menuitemradio' = 'menuitem',
) {
  await page.getByRole('button', { name: /^(المزيد|More)$/ }).click();
  await page.getByRole(role, { name }).click();
}
