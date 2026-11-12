import type { Page } from '@playwright/test';

/** Opens the sort menu (for the exclusive choices) or the «more» menu, and picks an item. */
export async function chooseFromMenu(
  page: Page,
  name: string,
  role: 'menuitem' | 'menuitemradio' = 'menuitem',
) {
  const button = role === 'menuitemradio' ? /^(ترتيب|Sort)$/ : /^(المزيد|More)$/;
  await page.getByRole('button', { name: button }).click();
  await page.getByRole(role, { name }).click();
}

/** Opens the side menu and picks «my data» (a button) or a language (a radio). */
export async function chooseFromDrawer(page: Page, name: string | RegExp) {
  await page.getByRole('button', { name: /^(القائمة الجانبية|Menu)$/ }).click();
  const dialog = page.getByRole('dialog');
  const radio = dialog.getByRole('radio', { name });
  await ((await radio.count()) > 0 ? radio : dialog.getByRole('button', { name })).click();
}

/** Taps a task (its card opens) and then «Edit» (the full form opens). */
export async function openEditor(page: Page, title: string) {
  await page.getByRole('button', { name: new RegExp(`^(تفاصيل|Details): ${title}$`) }).click();
  await page.getByRole('button', { name: /^(تعديل|Edit)$/ }).click();
}
