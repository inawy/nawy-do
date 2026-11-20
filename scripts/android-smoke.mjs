/* global navigator, getComputedStyle */
// Smoke test of the production build in REAL Chrome on an Android emulator (CI only, see
// .github/workflows/android.yml). The emulator reaches the preview server through `adb reverse`, so
// the page is on `localhost` (a secure context: service worker, IndexedDB and install work).
// Playwright drives the device over adb; screenshots go to `screenshots-android/`.
import { mkdirSync } from 'node:fs';
import { _android as android } from '@playwright/test';

const HOME = 'http://localhost:4173/';
mkdirSync('screenshots-android', { recursive: true });

const [device] = await android.devices();
if (!device) throw new Error('no Android device found');
console.log('device:', device.model(), device.serial());

const context = await device.launchBrowser({ locale: 'ar' });
// Android Chrome cannot open a second page over this protocol: use the one it starts with.
const page = context.pages()[0] ?? (await context.waitForEvent('page'));
const shot = (name) => page.screenshot({ path: `screenshots-android/${name}.png` });
const wait = { timeout: 30_000 };

try {
  await page.goto(HOME);
  await page.getByRole('button', { name: 'نية جديدة' }).waitFor(wait);
  await shot('1-home');

  await page.getByRole('button', { name: 'نية جديدة' }).click();
  await page.getByLabel('ناوي تعمل إيه؟').fill('اشتري خبز كل 3 أيام');
  await shot('2-add');
  await page.getByRole('button', { name: 'إضافة' }).click();
  await page.getByRole('button', { name: 'تفاصيل: اشتري خبز' }).waitFor(wait);
  await shot('3-added');

  // The task is in IndexedDB: it survives a reload.
  await page.reload();
  await page.getByRole('button', { name: 'تفاصيل: اشتري خبز' }).waitFor(wait);

  // Complete it by tapping the circle; the repeat moves it to the next date instead of finishing.
  await page.getByRole('checkbox', { name: /اشتري خبز/ }).click();
  await page.waitForTimeout(600);
  await shot('4-completed');

  // Reordering by dragging the handle (a mouse drag over adb: a finger swipe is not driven here).
  const adder = async (title) => {
    await page.getByRole('button', { name: 'نية جديدة' }).click();
    await page.getByLabel('ناوي تعمل إيه؟').fill(title);
    await page.getByRole('button', { name: 'إضافة' }).click();
    await page.getByRole('button', { name: `تفاصيل: ${title}` }).waitFor(wait);
  };
  for (const title of ['الأولى', 'الثانية', 'الثالثة']) await adder(title);
  const order = async () =>
    (await page.locator('.row .title').allTextContents()).filter((x) => x.startsWith('ال'));
  console.log('before drag:', (await order()).join(' | '));
  const grip = await page.getByRole('button', { name: 'تحريك: الثالثة' }).boundingBox();
  const last = await page.locator('.row', { hasText: 'الأولى' }).boundingBox();
  if (!grip || !last) throw new Error('rows not found for the drag');
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + grip.width / 2, last.y + last.height - 4, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await shot('5-dragged');
  const after = (await order()).join(' | ');
  console.log('after drag:', after);
  await page.reload();
  await page.getByRole('button', { name: 'تحريك: الثالثة' }).waitFor(wait);
  const kept = (await order()).join(' | ');
  console.log('after reload:', kept);
  if (kept !== 'الثانية | الأولى | الثالثة') throw new Error(`the order after a drag was: ${kept}`);

  // Dropping a dragged intention on a list in the bottom navigation moves it there. A mouse drag
  // again: a finger is not driven over adb, so this checks the layout and hit-testing in real
  // Chrome, not the touch sensor.
  await page.getByRole('button', { name: 'قائمة جديدة' }).click();
  await page.getByLabel('اسم القائمة').fill('هدف');
  await page.getByRole('button', { name: 'حفظ' }).click();
  await page.getByRole('button', { name: /^نواياي/ }).click();
  const goal = page.getByRole('button', { name: /^هدف/ });
  await goal.scrollIntoViewIfNeeded();
  const from = await page.getByRole('button', { name: 'تحريك: الثالثة' }).boundingBox();
  const to = await goal.boundingBox();
  if (!from || !to) throw new Error('boxes not found for the drop on a list');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 });
  const over = await goal.getAttribute('data-drop-over');
  // Over the list the dragged row turns see-through, so the highlighted tab can be read under it.
  const seeThrough = Number(
    await page.locator('.row.dragging').evaluate((el) => getComputedStyle(el).opacity),
  );
  await shot('7-drop-over');
  await page.mouse.up();
  console.log('drop target highlighted:', over !== null);
  console.log('dragged row opacity over the list:', seeThrough);
  if (over === null)
    throw new Error('the list in the navigation was not highlighted while dragging');
  if (!(seeThrough < 1)) throw new Error('the dragged row still hides the list it is over');
  await page.getByText('الثالثة', { exact: true }).waitFor({ state: 'hidden', ...wait });
  await goal.click();
  await page.getByRole('heading', { name: 'هدف', level: 1 }).waitFor(wait);
  await page.getByText('الثالثة', { exact: true }).waitFor(wait);
  await shot('8-dropped');
  console.log('drop on a list: ok');

  // `ready` can resolve while the worker is still «activating»: wait for it to finish.
  await page.waitForFunction(
    async () => (await navigator.serviceWorker.ready).active?.state === 'activated',
    undefined,
    wait,
  );
  console.log('service worker: activated');
  // The keyboard shortcuts list opens from the «more» menu.
  await page.getByRole('button', { name: 'المزيد' }).first().click();
  await page.getByRole('menuitem', { name: 'اختصارات لوحة المفاتيح' }).click();
  await page.getByRole('dialog', { name: 'اختصارات لوحة المفاتيح' }).waitFor(wait);
  await page.waitForTimeout(500);
  await shot('6-shortcuts');
  console.log('android smoke: ok');
} catch (error) {
  await shot('failure').catch(() => {});
  throw error;
} finally {
  await context.close();
  await device.close();
}
