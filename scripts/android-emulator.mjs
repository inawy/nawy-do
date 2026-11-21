/* global fetch, WebSocket, setTimeout */
// Drives the installed app inside an Android emulator through its WebView (Chrome DevTools protocol
// over a plain WebSocket), the way a person would (ADR 0045): add a task, give it a time two minutes
// ahead, send the app to the background, then check that the PHONE rings it. CI only.
import { execSync } from 'node:child_process';

const PKG = 'todo.nawy.app';
const out = process.argv[2] ?? 'emulator-out';
const log = (...a) => console.log('[e2e]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const adb = (cmd) => execSync(`adb ${cmd}`).toString();

const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const target = targets.find((t) => t.type === 'page') ?? targets[0];
if (!target) throw new Error('no WebView page found');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = () => rej(new Error('websocket failed'));
});
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    log('page exception:', JSON.stringify(msg.params.exceptionDetails?.exception?.description));
  }
};
const send = (method, params = {}) =>
  new Promise((res) => {
    id += 1;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
await send('Runtime.enable');
/** Runs `code` in the page and returns its value. */
async function ev(code) {
  const r = await send('Runtime.evaluate', {
    expression: `(async () => { ${code} })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.result?.exceptionDetails) {
    throw new Error(r.result.exceptionDetails.exception?.description ?? 'page error');
  }
  return r.result?.result?.value;
}
const HELPERS = `
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const byLabel = (l) => document.querySelector('[aria-label="' + l + '"]');
  const setInput = (el, v) => {
    if (!el) throw new Error('input not found for ' + v);
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const button = (re, root = document) => [...root.querySelectorAll('button')].find((b) => re.test(b.textContent + ' ' + (b.getAttribute('aria-label') ?? '')));
`;
const shot = (name) => adb(`exec-out screencap -p > ${out}/${name}.png`);

await sleep(3000);
log(
  'native?',
  JSON.stringify(
    await ev(
      `return { cap: window.Capacitor?.isNativePlatform?.(), bridge: window.androidBridge !== undefined };`,
    ),
  ),
);

await ev(`${HELPERS} button(/نية جديدة/).click(); await wait(600);
  const input = document.querySelector('input[aria-label="ناوي تعمل إيه؟"], [aria-label="ناوي تعمل إيه؟"]');
  setInput(input, 'Emulator test'); await wait(300);
  button(/^\\s*إضافة/).click(); await wait(1500);`);
await ev(`${HELPERS} button(/تفاصيل: Emulator test/).click(); await wait(1000);`);

const when =
  await ev(`const d = new Date(Date.now() + 2 * 60000); const p = (n) => String(n).padStart(2, '0');
  return { date: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()), time: p(d.getHours()) + ':' + p(d.getMinutes()) };`);
log('due (device clock):', JSON.stringify(when));
await ev(`${HELPERS}
  const dlg = document.querySelector('[role=dialog]');
  setInput(dlg.querySelector('input[type=date]'), ${JSON.stringify(when.date)}); await wait(300);
  setInput(dlg.querySelector('input[type=time]'), ${JSON.stringify(when.time)}); await wait(300);`);
shot('details');
await ev(
  `${HELPERS} button(/^\\s*حفظ/, document.querySelector('[role=dialog]')).click(); await wait(2500);`,
);
shot('saved');

// Let the app hand the plan to the phone, then ask the phone (not the app) what it holds.
await sleep(3000);
const alarms = adb(`shell dumpsys alarm`);
const held = alarms.split('\n').filter((l) => l.includes(PKG)).length;
log('alarm lines mentioning the app:', held);
ws.close();

// The app goes to the background and its process is ended: the reminder has to come from the phone.
adb('shell input keyevent KEYCODE_HOME');
await sleep(2000);
adb(`shell am kill ${PKG}`);
await sleep(1000);
log('app process after kill:', JSON.stringify(adb(`shell pidof ${PKG} || true`).trim()));

log('waiting for the reminder to ring…');
await sleep(150_000);
adb('shell cmd statusbar expand-notifications');
await sleep(2000);
shot('shade');
const dump = adb('shell dumpsys notification --noredact');
const posted = dump.includes('Emulator test') && dump.includes(`pkg=${PKG}`);
log('reminder posted while the app was closed:', posted);
if (!posted || held === 0) {
  log('FAILED: posted =', posted, ', alarm lines =', held);
  process.exit(1);
}
log('OK: the phone rang the reminder');
