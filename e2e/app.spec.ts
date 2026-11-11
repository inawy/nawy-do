import { chooseFromMenu, openEditor } from './menu';
import { expect, test, type Page } from '@playwright/test';

const prompt = 'ناوي تعمل إيه؟';

async function add(page: Page, title: string) {
  await page.getByRole('button', { name: 'نية جديدة' }).click();
  await page.getByLabel(prompt).fill(title);
  await page.getByRole('button', { name: 'إضافة' }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'نية جديدة' })).toBeVisible();
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
  await openEditor(page, 'مهمة اختبار');
  await page.getByRole('button', { name: 'حذف النية' }).click();
  await page.getByRole('button', { name: 'تأكيد الحذف' }).click();
  await expect(page.getByText('اتحذفت: مهمة اختبار')).toBeVisible();
  await page.getByRole('button', { name: 'تراجع' }).click();
  await expect(page.getByText('المنجزة (1)')).toBeVisible();
});

/** What is really stored (the screen shows a preview of the new order before the write ends). */
const stored = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const open = indexedDB.open('nawy-do');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const all = db.transaction('tasks').objectStore('tasks').getAll();
          all.onsuccess = () => {
            db.close();
            const live = (all.result as { title: string; sortOrder: number; deletedAt?: number }[])
              .filter((t) => t.deletedAt === undefined)
              .sort((a, b) => b.sortOrder - a.sortOrder);
            resolve(live.map((t) => t.title));
          };
        };
      }),
  );

const titles = async (page: Page) => {
  await page.locator('.row').first().waitFor(); // after a reload, wait until the list has loaded
  return page.locator('.list[aria-label="النوايا"] .title').allTextContents();
};

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

  await expect.poll(() => stored(page)).toEqual(['الثانية', 'الأولى', 'الثالثة']);
  await page.reload();
  expect(await titles(page)).toEqual(['الثانية', 'الأولى', 'الثالثة']);
});

test('moves an intention with the keyboard (Space, arrow, Space on its handle)', async ({
  page,
}) => {
  await add(page, 'أ');
  await add(page, 'ب');
  expect(await titles(page)).toEqual(['ب', 'أ']);
  await page.getByRole('button', { name: 'تحريك: ب' }).focus();
  await page.keyboard.press('Space');
  // dnd-kit attaches its key listeners just after the pick-up, so wait for it before moving.
  await expect(page.getByRole('button', { name: 'تحريك: ب' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(250);
  await page.keyboard.press('Space');
  await expect.poll(() => stored(page)).toEqual(['أ', 'ب']);
  await page.reload();
  expect(await titles(page)).toEqual(['أ', 'ب']);
});

test('creates a list, adds a task to it, and it survives a reload', async ({ page }) => {
  await page.getByRole('button', { name: 'قائمة جديدة' }).click();
  await page.getByLabel('اسم القائمة').fill('العمل');
  await page.getByRole('button', { name: 'حفظ' }).click();
  await expect(page.getByRole('heading', { name: 'العمل' })).toBeVisible();
  await add(page, 'تقرير الأسبوع');
  await page.reload();
  await page.getByRole('button', { name: 'العمل' }).click();
  await expect(page.getByText('تقرير الأسبوع', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'نواياي' }).click();
  await expect(page.getByText('تقرير الأسبوع', { exact: true })).toHaveCount(0);
});

test('deleting a list returns its tasks to main; undo restores the list', async ({ page }) => {
  await page.getByRole('button', { name: 'قائمة جديدة' }).click();
  await page.getByLabel('اسم القائمة').fill('مؤقتة');
  await page.getByRole('button', { name: 'حفظ' }).click();
  await add(page, 'بداخلها');
  await chooseFromMenu(page, 'خيارات القائمة');
  await page.getByRole('button', { name: 'حذف القائمة' }).click();
  await page.getByRole('button', { name: 'تأكيد الحذف' }).click();
  await expect(page.getByText('بداخلها', { exact: true })).toBeVisible(); // main now
  await page.getByRole('button', { name: 'تراجع' }).click();
  await expect(page.getByRole('button', { name: 'مؤقتة' })).toBeVisible();
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
  await openEditor(page, 'ادفع الفاتورة');
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
  const manifest = (await res.json()) as {
    name: string;
    dir: string;
    icons: unknown[];
    screenshots: { src: string; form_factor: string }[];
  };
  expect(manifest.name).toBe('ناوي دو');
  expect(manifest.dir).toBe('rtl');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
  // The install dialog's pictures: both form factors, and every file is really served.
  expect(new Set(manifest.screenshots.map((x) => x.form_factor))).toEqual(
    new Set(['narrow', 'wide']),
  );
  for (const shot of manifest.screenshots) {
    const img = await request.get(new URL(shot.src, page.url()).toString());
    expect(img.ok(), shot.src).toBe(true);
  }
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
  await expect(page.getByRole('button', { name: 'نية جديدة' })).toBeVisible();
  await add(page, 'اتكتبت بلا إنترنت');
  await context.setOffline(false);
});

test('the Back button closes a sheet instead of leaving the app', async ({ page }) => {
  await add(page, 'مهمة للرجوع');
  await page.getByRole('button', { name: 'تفاصيل: مهمة للرجوع' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('مهمة للرجوع', { exact: true })).toBeVisible();
});

test('dragging the sheet handle down closes it; a short drag does not', async ({ page }) => {
  await add(page, 'مهمة للسحب');
  await page.getByRole('button', { name: 'تفاصيل: مهمة للسحب' }).click();
  const handle = page.locator('.sheet-grab');
  const box = await handle.boundingBox();
  if (!box) throw new Error('no handle');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 30, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 250, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('a long press on a row starts selection with it picked', async ({ page }) => {
  await add(page, 'ضغطة طويلة');
  await add(page, 'نية تانية');
  const box = await page.getByRole('button', { name: 'تفاصيل: ضغطة طويلة' }).boundingBox();
  if (!box) throw new Error('no row');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await expect(page.getByRole('checkbox', { name: 'تحديد: ضغطة طويلة' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'تحديد: نية تانية' })).not.toBeChecked();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('a normal tap still opens the details (no long press)', async ({ page }) => {
  await add(page, 'ضغطة قصيرة');
  await page.getByRole('button', { name: 'تفاصيل: ضغطة قصيرة' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

async function remove(page: Page, title: string) {
  await openEditor(page, title);
  await page.getByRole('button', { name: 'حذف النية' }).click();
  await page.getByRole('button', { name: 'تأكيد الحذف' }).click();
}

test('two deletions in a row can be undone one after the other', async ({ page }) => {
  await add(page, 'الأولى');
  await add(page, 'التانية');
  await remove(page, 'التانية');
  await expect(page.getByText('اتحذفت: التانية')).toBeVisible();
  await remove(page, 'الأولى');
  await expect(page.getByText('اتحذفت: الأولى (+1)')).toBeVisible();
  await page.getByRole('button', { name: 'تراجع' }).click();
  await expect(page.getByText('الأولى', { exact: true })).toBeVisible();
  await expect(page.getByText('اتحذفت: التانية')).toBeVisible();
  await page.getByRole('button', { name: 'تراجع' }).click();
  await expect(page.getByText('التانية', { exact: true })).toBeVisible();
});

// A finger drag across the content moves to the neighbouring list (RTL: to the right = next).
test('swiping the content sideways moves between lists', async ({ page }) => {
  await add(page, 'مهمة');
  const swipe = (dx: number) =>
    page.evaluate((dx) => {
      const main = document.querySelector('main') as HTMLElement;
      const at = (type: string, x: number) =>
        main.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            pointerType: 'touch',
            pointerId: 7,
            clientX: x,
            clientY: 300,
          }),
        );
      at('pointerdown', 200);
      at('pointermove', 200 + dx / 2);
      at('pointermove', 200 + dx);
      at('pointerup', 200 + dx);
    }, dx);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('نواياي');
  await swipe(150);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('اليوم');
  await page.waitForTimeout(400); // the slide-in finishes before the next swipe counts
  await swipe(-150);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('نواياي');
  await page.waitForTimeout(400);
  await swipe(-150); // nothing before the first view
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('نواياي');
  await page.waitForTimeout(400);
  await swipe(20); // too short
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('نواياي');
});

test('text shared from another app becomes an intention, once', async ({ page }) => {
  await page.goto('/?share_text=' + encodeURIComponent('اتصل بالسباك'));
  await expect(page.getByText('اتصل بالسباك', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/$/); // the share parameters are gone
  await page.reload();
  await expect(page.getByText('اتصل بالسباك', { exact: true })).toHaveCount(1);
});

test('the «new intention» shortcut opens the add sheet with its field focused', async ({
  page,
}) => {
  await page.goto('/?new=1');
  await expect(page.getByLabel(prompt)).toBeFocused();
});

test('the web manifest declares shortcuts and a share target', async ({ page, request }) => {
  const link = await page.locator('link[rel="manifest"]').getAttribute('href');
  const res = await request.get(new URL(link ?? '/manifest.webmanifest', page.url()).href);
  const m = (await res.json()) as {
    share_target?: { method: string; params: Record<string, string> };
    shortcuts?: { url: string }[];
    display_override?: string[];
  };
  expect(m.share_target?.method).toBe('GET');
  expect(m.share_target?.params).toEqual({
    title: 'share_title',
    text: 'share_text',
    url: 'share_url',
  });
  expect(m.shortcuts?.[0]?.url).toContain('new=1');
  expect(m.display_override).toContain('standalone');
});

test('the today view takes new intentions as due today', async ({ page }) => {
  await page.getByRole('button', { name: /^اليوم/ }).click();
  await expect(page.getByRole('heading', { name: 'اليوم' })).toBeVisible();
  await add(page, 'مهمة النهارده');
  await expect(page.getByRole('heading', { name: 'النهارده', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: /^نواياي/ }).click();
  await expect(page.getByText('مهمة النهارده', { exact: true })).toBeVisible();
});

test('completing a repeating task keeps it open on its next date', async ({ page }) => {
  await add(page, 'دواء');
  await openEditor(page, 'دواء');
  await page.getByRole('button', { name: 'النهارده' }).click();
  await page.getByLabel('تكرار').selectOption('daily');
  await page.getByRole('button', { name: 'حفظ' }).click();
  await page.getByRole('checkbox', { name: 'إنجاز: دواء' }).click();
  await expect(page.getByText('دواء', { exact: true })).toBeVisible();
  await expect(page.getByText('بكرة')).toBeVisible();
  await expect(page.getByText('المنجزة')).toBeHidden();
});

test('sorting alphabetically orders the list, hides dragging, and is remembered', async ({
  page,
}) => {
  await add(page, 'باء');
  await add(page, 'ألف');
  const titles = () => page.locator('.row .title').allTextContents();
  expect(await titles()).toEqual(['ألف', 'باء']); // manual: newest on top
  await add(page, 'تاء');
  await chooseFromMenu(page, 'ترتيب أبجدي', 'menuitemradio');
  expect(await titles()).toEqual(['ألف', 'باء', 'تاء']);
  await expect(page.locator('.grip')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.row .title')).toHaveCount(3); // loaded: allTextContents does not wait
  expect(await titles()).toEqual(['ألف', 'باء', 'تاء']);
  await chooseFromMenu(page, 'ترتيب يدوي', 'menuitemradio');
  expect(await titles()).toEqual(['تاء', 'ألف', 'باء']);
});

test('a due time is set with the date and shown on the row', async ({ page }) => {
  await add(page, 'اجتماع');
  await openEditor(page, 'اجتماع');
  await expect(page.getByLabel('الساعة')).toBeDisabled(); // no date yet
  await page.getByRole('button', { name: 'النهارده' }).click();
  await page.getByLabel('الساعة').fill('21:30');
  await page.getByRole('button', { name: 'حفظ' }).click();
  await expect(page.getByText('النهارده · 9:30 م')).toBeVisible();
});

test('a list can be given a colour, and it shows in the navigation', async ({ page }) => {
  await page.getByRole('button', { name: 'قائمة جديدة' }).click();
  await page.getByLabel('اسم القائمة').fill('سفر');
  await page.getByRole('radio', { name: 'أخضر' }).click();
  await expect(page.getByRole('radio', { name: 'أخضر' })).toBeChecked();
  await page.getByRole('button', { name: 'حفظ' }).click();
  await expect(page.locator('.nav-item[data-list-color="green"]')).toContainText('سفر');
  await chooseFromMenu(page, 'خيارات القائمة');
  await page.getByRole('radio', { name: 'أخضر' }).click(); // the same swatch again clears it
  await page.getByRole('button', { name: 'حفظ' }).click();
  await expect(page.locator('.nav-item[data-list-color]')).toHaveCount(0);
});

test('dropping a dragged intention on a list in the navigation moves it there', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'قائمة جديدة' }).click();
  await page.getByLabel('اسم القائمة').fill('هدف');
  await page.getByRole('button', { name: 'حفظ' }).click();
  await page.getByRole('button', { name: /^نواياي/ }).click();
  await add(page, 'باقية');
  await add(page, 'منقولة');
  const grip = page.getByRole('button', { name: 'تحريك: منقولة' });
  const from = await grip.boundingBox();
  const to = await page.getByRole('button', { name: /^هدف/ }).boundingBox();
  if (!from || !to) throw new Error('no boxes');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await expect(page.getByRole('button', { name: /^هدف/ })).toHaveAttribute('data-drop-over', '');
  await page.mouse.up();
  await expect(page.getByText('منقولة', { exact: true })).toBeHidden();
  await expect(page.getByText('باقية', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^هدف/ }).click();
  await expect(page.getByRole('heading', { name: 'هدف', level: 1 })).toBeVisible();
  await expect(page.getByText('منقولة', { exact: true })).toBeVisible();
});

test('a tap opens a quick card; Edit opens the form; Delete from the card can be undone', async ({
  page,
}) => {
  await add(page, 'بطاقة سريعة');
  await page.getByRole('button', { name: 'تفاصيل: بطاقة سريعة' }).click();
  const card = page.getByRole('dialog', { name: 'النية' });
  await expect(card.getByRole('heading', { name: 'بطاقة سريعة' })).toBeVisible();
  for (const name of ['تعديل', 'نسخ', 'حذف']) {
    await expect(card.getByRole('button', { name })).toBeVisible();
  }
  await card.getByRole('button', { name: 'تعديل' }).click();
  await expect(page.getByLabel('ملاحظات')).toBeVisible();
  await page.getByRole('button', { name: 'إلغاء' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.getByRole('button', { name: 'تفاصيل: بطاقة سريعة' }).click();
  await page.getByRole('dialog', { name: 'النية' }).getByRole('button', { name: 'حذف' }).click();
  await page.getByRole('button', { name: 'تأكيد الحذف' }).click();
  await expect(page.getByText('اتحذفت: بطاقة سريعة')).toBeVisible();
  await page.getByRole('button', { name: 'تراجع' }).click();
  await expect(page.getByText('بطاقة سريعة', { exact: true })).toBeVisible();
});

test('swiping a card down, left or right closes it; a short swipe does not', async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(!isMobile, 'real touch input is only emulated on the phone project');
  await add(page, 'سحب البطاقة');
  const cdp = await context.newCDPSession(page);
  const swipe = async (dx: number, dy: number) => {
    const box = await page.locator('.sheet').boundingBox();
    if (!box) throw new Error('no sheet');
    const x0 = box.x + box.width / 2;
    const y0 = box.y + 70;
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
      });
    await touch('touchStart', x0, y0);
    for (let i = 1; i <= 8; i++) await touch('touchMove', x0 + (dx * i) / 8, y0 + (dy * i) / 8);
    await touch('touchEnd', x0 + dx, y0 + dy);
  };
  const open = async () => {
    await page.getByRole('button', { name: 'تفاصيل: سحب البطاقة' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  };
  await open();
  await swipe(0, 30); // too short
  await page.waitForTimeout(400);
  await expect(page.getByRole('dialog')).toBeVisible();
  for (const [dx, dy] of [
    [0, 260],
    [300, 0],
    [-300, 0],
  ] as const) {
    await swipe(dx, dy);
    await expect(page.getByRole('dialog')).toBeHidden();
    await open();
  }
});
