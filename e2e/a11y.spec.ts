import AxeBuilder from '@axe-core/playwright';
import { chooseFromMenu } from './menu';
import { expect, test, type Page } from '@playwright/test';

// Automated accessibility checks (axe) on the main screen and the sheets, in both colour schemes.
// axe finds the mechanical problems (names, roles, contrast, focus); it cannot judge the reading
// order or how it sounds in a screen reader, which still needs a person with one.
const prompt = 'ناوي تعمل إيه؟';

async function add(page: Page, title: string) {
  await page.getByLabel(prompt).fill(title);
  await page.getByRole('button', { name: 'إضافة' }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

async function violations(page: Page): Promise<string[]> {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} — ${v.nodes
          .slice(0, 3)
          .map((n) => `${n.target.join(' ')} [${n.any.map((c) => c.message).join('; ')}]`)
          .join(' | ')}`,
    );
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(scheme, () => {
    test.use({ colorScheme: scheme });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await expect(page.getByLabel(prompt)).toBeVisible();
      await add(page, 'اشتري خبز');
      await add(page, 'اتصل بالطبيب');
    });

    test('main screen', async ({ page }) => {
      expect(await violations(page)).toEqual([]);
    });

    test('details sheet', async ({ page }) => {
      await page.getByRole('button', { name: 'تفاصيل: اشتري خبز' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });

    test('data sheet', async ({ page }) => {
      await chooseFromMenu(page, 'بياناتي', 'menuitem');
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  });
}

// The English interface (LTR) gets the same mechanical checks.
test.describe('english', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await chooseFromMenu(page, 'English');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    const input = page.getByLabel('What do you intend to do?');
    await input.fill('Buy bread');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Buy bread', { exact: true })).toBeVisible();
  });

  test('main screen', async ({ page }) => {
    expect(await violations(page)).toEqual([]);
  });

  test('data sheet', async ({ page }) => {
    await chooseFromMenu(page, 'My data', 'menuitem');
    await expect(page.getByRole('dialog')).toBeVisible();
    // Let the sheet's opening and the buttons' colour transitions settle before measuring contrast.
    await page.waitForTimeout(500);
    expect(await violations(page)).toEqual([]);
  });
});
