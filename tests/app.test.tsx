import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '@/app/App';
import { allRecords, createDb, type NawyDoDb } from '@/data';

let db: NawyDoDb;
let n = 0;
let clock = 1000;
const now = () => (clock += 10);

beforeEach(() => {
  db = createDb(`app-${n++}`);
});
afterEach(cleanup);

async function addIntention(title: string) {
  fireEvent.change(screen.getByLabelText('ناوي تعمل إيه؟'), { target: { value: title } });
  fireEvent.click(screen.getByRole('button', { name: 'إضافة' }));
  await screen.findByText(title);
}

describe('App', () => {
  it('shows the name, the prompt and an honest empty state', async () => {
    render(<App db={db} now={now} />);
    expect(screen.getByText('ناوي دو')).toBeTruthy();
    expect(screen.getByPlaceholderText('ناوي تعمل إيه؟')).toBeTruthy();
    await screen.findByText(/مفيش نوايا/);
  });

  it('does not add an empty intention', async () => {
    render(<App db={db} now={now} />);
    await screen.findByText(/مفيش نوايا/);
    const button = screen.getByRole('button', { name: 'إضافة' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('adds, completes and reopens an intention', async () => {
    render(<App db={db} now={now} />);
    await addIntention('اشتري خبز');
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    fireEvent.click(box);
    await screen.findByText('المنجزة (1)');
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(screen.queryByText('المنجزة (1)')).toBeNull());
  });

  it('deletes with a tombstone and undo brings it back', async () => {
    render(<App db={db} now={now} />);
    await addIntention('سر');
    fireEvent.click(screen.getByRole('button', { name: 'حذف: سر' }));
    await screen.findByText('اتحذفت: سر');
    await waitFor(async () => expect((await allRecords(db))[0]?.deletedAt).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'تراجع' }));
    await screen.findByText('سر');
    expect((await allRecords(db))[0]?.deletedAt).toBeUndefined();
  });
});
