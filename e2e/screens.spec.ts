import { chooseFromDrawer } from './menu';
import { expect, test, type Page } from '@playwright/test';

// Not assertions about behaviour: a visual record of every main screen, captured from the PRODUCTION
// build on a phone and on a desktop. CI uploads `screenshots/` so a reviewer can look at the UI
// without running anything (docs/ROADMAP.md uses them as the baseline for each phase).
const prompt = 'ناوي تعمل إيه؟';

async function add(page: Page, title: string) {
  await page.getByRole('button', { name: 'نية جديدة' }).click();
  await page.getByLabel(prompt).fill(title);
  await page.getByRole('button', { name: 'إضافة' }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

async function seed(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'نية جديدة' })).toBeVisible();
  await page.getByRole('button', { name: 'قائمة جديدة' }).click();
  await page.getByLabel('اسم القائمة').fill('العمل');
  await page.getByRole('radio', { name: 'برتقالي' }).click();
  await page.getByRole('button', { name: 'حفظ' }).click();
  await add(page, 'ابعت تقرير الأسبوع');
  await page.getByRole('button', { name: 'نواياي' }).click();
  for (const t of ['اتصل بالدكتور', 'احجز تذكرة السفر', 'اشتري خبز وحليب']) await add(page, t);
  await page.getByRole('button', { name: 'تمييز: اشتري خبز وحليب' }).click();
  await page.getByRole('checkbox', { name: 'إنجاز: اتصل بالدكتور' }).click();
}

async function record(page: Page, prefix: string, project: string) {
  const shot = async (name: string) => {
    await page.waitForTimeout(400); // let any style transition settle before the picture
    await page.screenshot({ path: `screenshots/${project}-${prefix}${name}.png` });
  };
  await seed(page);
  await shot('1-main');
  await page.getByRole('button', { name: 'تفاصيل: احجز تذكرة السفر' }).click();
  await shot('2a-card');
  await page.getByRole('button', { name: 'تعديل' }).click();
  await shot('2-details');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'المفضلة' }).click();
  await shot('3-starred');
  await page.getByRole('button', { name: 'العمل' }).click();
  await shot('4-list');
  await chooseFromDrawer(page, 'بياناتي');
  await shot('5-data');
  await page.getByRole('button', { name: 'إغلاق' }).click();
  await page.getByRole('button', { name: 'القائمة الجانبية' }).click();
  await shot('6-menu');
  await page.keyboard.press('Escape');
  await page.getByRole('checkbox', { name: 'إنجاز: ابعت تقرير الأسبوع' }).click();
  await shot('7-done');
  await page.getByRole('button', { name: 'اليوم' }).click();
  await shot('8-empty-today');
  await chooseFromDrawer(page, /سلة المحذوفات/);
  await shot('9-trash');
}

test('screens', async ({ page }, info) => {
  await record(page, '', info.project.name);
});

test.describe('dark', () => {
  test.use({ colorScheme: 'dark' });
  test('screens in the dark theme', async ({ page }, info) => {
    await record(page, 'dark-', info.project.name);
  });
});
