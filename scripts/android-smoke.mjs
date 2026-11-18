/* global navigator */
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

  // `ready` can resolve while the worker is still «activating»: wait for it to finish.
  await page.waitForFunction(
    async () => (await navigator.serviceWorker.ready).active?.state === 'activated',
    undefined,
    wait,
  );
  console.log('service worker: activated');
  console.log('android smoke: ok');
} catch (error) {
  await shot('failure').catch(() => {});
  throw error;
} finally {
  await context.close();
  await device.close();
}
