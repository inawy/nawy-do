import type { Page } from '@playwright/test';

/** Opens the «more» menu and picks an item. */
export async function chooseFromMenu(page: Page, name: string) {
  await page.getByRole('button', { name: 'المزيد' }).click();
  await page.getByRole('menuitem', { name }).click();
}
