import { expect, test, type Page } from '@playwright/test';

// Not assertions about behaviour: a visual record of every main screen, captured from the PRODUCTION
// build on a phone and on a desktop. CI uploads `screenshots/` so a reviewer can look at the UI
// without running anything (docs/ROADMAP.md uses them as the baseline for each phase).
const prompt = 'ناوي تعمل إيه؟';

async function add(page: Page, title: string) {
  await page.getByLabel(prompt).fill(title);
  await page.getByRole('button', { name: 'إضافة' }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

async function seed(page: Page) {
  await page.goto('/');
  await expect(page.getByLabel(prompt)).toBeVisible();
  await page.getByRole('button', { name: 'قائمة جديدة' }).click();
  await page.getByLabel('اسم القائمة').fill('العمل');
  await page.getByRole('button', { name: 'حفظ' }).click();
  await add(page, 'ابعت تقرير الأسبوع');
  await page.getByRole('button', { name: 'نواياي' }).click();
  for (const t of ['اتصل بالدكتور', 'احجز تذكرة السفر', 'اشتري خبز وحليب']) await add(page, t);
  await page.getByRole('button', { name: 'تمييز: اشتري خبز وحليب' }).click();
  await page.getByRole('checkbox', { name: 'إنجاز: اتصل بالدكتور' }).click();
}

test('screens', async ({ page }, info) => {
  const shot = (name: string) =>
    page.screenshot({ path: `screenshots/${info.project.name}-${name}.png` });
  await seed(page);
  await shot('1-main');
  await page.getByRole('button', { name: 'تفاصيل: احجز تذكرة السفر' }).click();
  await shot('2-details');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'المفضلة' }).click();
  await shot('3-starred');
  await page.getByRole('button', { name: 'العمل' }).click();
  await shot('4-list');
  await page.getByRole('button', { name: 'بياناتي' }).click();
  await shot('5-data');
});
