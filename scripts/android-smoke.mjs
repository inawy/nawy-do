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

  await page.getByRole('button', { name: 'نية جديدة' }).tap();
  await page.getByLabel('ناوي تعمل إيه؟').fill('اشتري خبز كل 3 أيام');
  await shot('2-add');
  await page.getByRole('button', { name: 'إضافة' }).tap();
  await page.getByRole('button', { name: 'تفاصيل: اشتري خبز' }).waitFor(wait);
  await shot('3-added');

  // The task is in IndexedDB: it survives a reload.
  await page.reload();
  await page.getByRole('button', { name: 'تفاصيل: اشتري خبز' }).waitFor(wait);

  // Complete it by tapping the circle; the repeat moves it to the next date instead of finishing.
  await page.getByRole('checkbox', { name: /اشتري خبز/ }).tap();
  await page.waitForTimeout(600);
  await shot('4-completed');

  const worker = await page.evaluate(
    async () => (await navigator.serviceWorker.ready).active?.state,
  );
  console.log('service worker:', worker);
  if (worker !== 'activated') throw new Error('the service worker did not activate');
  console.log('android smoke: ok');
} catch (error) {
  await shot('failure').catch(() => {});
  throw error;
} finally {
  await context.close();
  await device.close();
}
