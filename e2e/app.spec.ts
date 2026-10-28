import { expect, test, type Page } from '@playwright/test';

const prompt = 'ناوي تعمل إيه؟';

async function add(page: Page, title: string) {
  await page.getByLabel(prompt).fill(title);
  await page.getByRole('button', { name: 'إضافة' }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel(prompt)).toBeVisible();
});

test('adds an intention and it survives a reload', async ({ page }) => {
  await add(page, 'اشتري خبز');
  await page.reload();
  await expect(page.getByText('اشتري خبز', { exact: true })).toBeVisible();
});

test('completes, then deletes with undo', async ({ page }) => {
  await add(page, 'مهمة اختبار');
  // click, not check(): the task leaves the list at once, so there is no state left to verify.
  await page.getByRole('checkbox').click();
  await expect(page.getByText('المنجزة (1)')).toBeVisible();
  await page.getByText('المنجزة (1)').click();
  await page.getByRole('button', { name: 'تفاصيل: مهمة اختبار' }).click();
  await page.getByRole('button', { name: 'حذف النية' }).click();
  await expect(page.getByText('اتحذفت: مهمة اختبار')).toBeVisible();
  await page.getByRole('button', { name: 'تراجع' }).click();
  await expect(page.getByText('المنجزة (1)')).toBeVisible();
});

const titles = (page: Page) => page.locator('.list[aria-label="النوايا"] .title').allTextContents();

test('drags an intention to a new place and the order survives a reload', async ({ page }) => {
  await add(page, 'الأولى');
  await add(page, 'الثانية');
  await add(page, 'الثالثة');
  expect(await titles(page)).toEqual(['الثالثة', 'الثانية', 'الأولى']);

  const row = page.locator('.row', { hasText: 'الثالثة' });
  await row.hover();
  const grip = row.getByRole('button', { name: 'تحريك: الثالثة' });
  const box = (await grip.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const last = (await page.locator('.row', { hasText: 'الأولى' }).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, last.y + last.height - 4, { steps: 15 });
  await page.mouse.up();

  await expect.poll(() => titles(page)).toEqual(['الثانية', 'الأولى', 'الثالثة']);
  await page.reload();
  expect(await titles(page)).toEqual(['الثانية', 'الأولى', 'الثالثة']);
});

test('moves an intention with the keyboard (Alt+Arrow on its handle)', async ({ page }) => {
  await add(page, 'أ');
  await add(page, 'ب');
  const grip = page.getByRole('button', { name: 'تحريك: ب' });
  await grip.focus();
  await page.keyboard.press('Alt+ArrowDown');
  await expect.poll(() => titles(page)).toEqual(['أ', 'ب']);
  await expect(page.getByRole('button', { name: 'تحريك: ب' })).toBeFocused();
});

test('a starred intention appears in the favourites view', async ({ page }) => {
  await add(page, 'مهمة مميزة');
  await add(page, 'مهمة عادية');
  await page.getByRole('button', { name: 'تمييز: مهمة مميزة' }).click();
  await page.getByRole('button', { name: 'المفضلة' }).click();
  await expect(page.getByText('مهمة مميزة', { exact: true })).toBeVisible();
  await expect(page.getByText('مهمة عادية', { exact: true })).toHaveCount(0);
});

test('a due date shows in the scheduled view', async ({ page }) => {
  await add(page, 'ادفع الفاتورة');
  await page.getByRole('button', { name: 'تفاصيل: ادفع الفاتورة' }).click();
  await page.getByLabel('تاريخ الاستحقاق').fill('2999-01-01');
  await page.getByRole('button', { name: 'حفظ' }).click();
  await page.getByRole('button', { name: 'مجدولة' }).click();
  await expect(page.getByRole('heading', { name: 'قادمة' })).toBeVisible();
  await expect(page.getByText('ادفع الفاتورة', { exact: true })).toBeVisible();
});

test('serves a web app manifest that names the product', async ({ page, request }) => {
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const res = await request.get(new URL(href ?? '', page.url()).toString());
  const manifest = (await res.json()) as { name: string; dir: string; icons: unknown[] };
  expect(manifest.name).toBe('ناوي دو');
  expect(manifest.dir).toBe('rtl');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
});

test('keeps working offline once the service worker has cached the app', async ({
  page,
  context,
}) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel(prompt)).toBeVisible();
  await add(page, 'اتكتبت بلا إنترنت');
  await context.setOffline(false);
});
