import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { addTask, createDb, listTasks, SNAPSHOT_DB_NAME, type NawyDoDb } from '@/data';

let db: NawyDoDb;
let n = 0;
const now = () => 1_700_000_000_000;
const today = () => '2026-10-29';
beforeEach(() => {
  db = createDb(`backup-ui-${n++}`);
});
afterEach(cleanup);

const open = async () => {
  render(<App db={db} now={now} today={today} />);
  await screen.findByText(/مفيش نوايا لسه|جاري/);
  fireEvent.click(screen.getByRole('button', { name: 'بياناتي' }));
};

const file = (text: string) => new File([text], 'b.json', { type: 'application/json' });
const pick = (f: File) =>
  fireEvent.change(screen.getByLabelText('ملف النسخة الاحتياطية'), { target: { files: [f] } });

describe('بياناتي', () => {
  it('imports a backup file and merges it', async () => {
    await open();
    const envelope = JSON.stringify({
      app: 'nawy-do',
      schemaVersion: 2,
      exportedAt: 1,
      tasks: [
        {
          id: 'a',
          title: 'من الملف',
          status: 'open',
          starred: false,
          sortOrder: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      lists: [],
    });
    pick(file(envelope));
    await screen.findByText(/استوردت 1 من 1/);
    await waitFor(async () =>
      expect((await listTasks(db)).map((t) => t.title)).toEqual(['من الملف']),
    );
  });

  it('refuses a file from another app and changes nothing', async () => {
    await addTask(db, 'x', 'موجودة', 1);
    await open();
    pick(file('{"app":"other"}'));
    await screen.findByText('الملف ده مش من ناوي دو.');
    expect((await listTasks(db)).map((t) => t.title)).toEqual(['موجودة']);
  });

  it('refuses text that is not JSON', async () => {
    await open();
    pick(file('hello'));
    await screen.findByText('الملف مش ملف نسخة احتياطية سليم.');
  });

  it('exports a download named after today', async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'تنزيل نسخة احتياطية' }));
    await screen.findByText('نزّلت النسخة الاحتياطية.');
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it('lists a safety copy and restores it (merging, deleting nothing)', async () => {
    const store = new Dexie(SNAPSHOT_DB_NAME);
    store.version(1).stores({ snapshots: '++id, createdAt' });
    const json = JSON.stringify({
      app: 'nawy-do',
      schemaVersion: 1,
      exportedAt: 5,
      tasks: [
        {
          id: 'old',
          title: 'قديمة',
          status: 'open',
          starred: false,
          sortOrder: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });
    await store.table('snapshots').add({ createdAt: 5, fromVersion: 1, json });
    store.close();
    await addTask(db, 'now', 'حالية', 1);
    await open();
    await screen.findByText('نسخ أمان قبل التحديثات');
    fireEvent.click(screen.getByRole('button', { name: /استرجاع/ }));
    await screen.findByText(/رجّعت 1 عنصر/);
    await waitFor(async () =>
      expect((await listTasks(db)).map((t) => t.title).sort()).toEqual(['حالية', 'قديمة']),
    );
  });
});
