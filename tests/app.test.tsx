import 'fake-indexeddb/auto';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '@/app/App';
import { allRecords, createDb, type NawyDoDb } from '@/data';

let db: NawyDoDb;
let n = 0;
let clock = 1000;
const now = () => (clock += 10);
const today = () => '2026-10-27';

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
    render(<App db={db} now={now} today={today} />);
    expect(screen.getByText('ناوي دو')).toBeTruthy();
    expect(screen.getByPlaceholderText('ناوي تعمل إيه؟')).toBeTruthy();
    await screen.findByText(/مفيش نوايا/);
  });

  it('does not add an empty intention', async () => {
    render(<App db={db} now={now} today={today} />);
    await screen.findByText(/مفيش نوايا/);
    const button = screen.getByRole('button', { name: 'إضافة' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('adds, completes and reopens an intention', async () => {
    render(<App db={db} now={now} today={today} />);
    await addIntention('اشتري خبز');
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    fireEvent.click(box);
    await screen.findByText('المنجزة (1)');
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(screen.queryByText('المنجزة (1)')).toBeNull());
  });

  it('deletes with a tombstone and undo brings it back', async () => {
    render(<App db={db} now={now} today={today} />);
    await addIntention('سر');
    fireEvent.click(screen.getByRole('button', { name: 'تفاصيل: سر' }));
    fireEvent.click(screen.getByRole('button', { name: 'حذف النية' }));
    await screen.findByText('اتحذفت: سر');
    await waitFor(async () => expect((await allRecords(db))[0]?.deletedAt).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'تراجع' }));
    await screen.findByText('سر');
    expect((await allRecords(db))[0]?.deletedAt).toBeUndefined();
  });

  it('edits details and shows the task in the scheduled view', async () => {
    render(<App db={db} now={now} today={today} />);
    await addIntention('ادفع الفاتورة');
    fireEvent.click(screen.getByRole('button', { name: 'تفاصيل: ادفع الفاتورة' }));
    fireEvent.change(screen.getByLabelText('تاريخ الاستحقاق'), { target: { value: '2026-10-27' } });
    fireEvent.change(screen.getByLabelText('ملاحظات'), { target: { value: 'من التطبيق' } });
    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }));
    await screen.findByText('من التطبيق');
    expect(screen.getAllByText('النهارده').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'مجدولة' }));
    await screen.findByRole('heading', { name: 'النهارده' });
    fireEvent.click(screen.getByRole('button', { name: 'نواياي' }));
    expect(screen.queryByRole('heading', { name: 'النهارده' })).toBeNull();
  });

  it('clearing the date removes it and the scheduled view says so', async () => {
    render(<App db={db} now={now} today={today} />);
    await addIntention('x');
    fireEvent.click(screen.getByRole('button', { name: 'تفاصيل: x' }));
    fireEvent.change(screen.getByLabelText('تاريخ الاستحقاق'), { target: { value: '2026-10-28' } });
    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }));
    await screen.findByText('بكرة');
    fireEvent.click(screen.getByRole('button', { name: 'تفاصيل: x' }));
    fireEvent.change(screen.getByLabelText('تاريخ الاستحقاق'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }));
    await waitFor(() => expect(screen.queryByText('بكرة')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'مجدولة' }));
    await screen.findByText(/مفيش نوايا بتاريخ/);
  });
});
describe('stars', () => {
  it('marks an intention and lists it in the favourites view', async () => {
    render(<App db={db} now={now} today={today} />);
    await addIntention('عادية');
    await addIntention('مهمة');
    fireEvent.click(screen.getByRole('button', { name: 'تمييز: مهمة' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'تمييز: مهمة' }).getAttribute('aria-pressed')).toBe(
        'true',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'المفضلة' }));
    await screen.findByRole('heading', { name: 'المفضلة' });
    expect(screen.queryByText('عادية')).toBeNull();
    expect(screen.getByText('مهمة')).toBeTruthy();
  });

  it('shows an honest empty state for favourites', async () => {
    render(<App db={db} now={now} today={today} />);
    await screen.findByText(/مفيش نوايا لسه/);
    fireEvent.click(screen.getByRole('button', { name: 'المفضلة' }));
    await screen.findByText(/مفيش نوايا مميزة/);
  });
});

describe('steps', () => {
  it('adds steps in the sheet, shows progress, and keeps a typed step on save', async () => {
    render(<App db={db} now={now} today={today} />);
    await addIntention('سفر');
    fireEvent.click(screen.getByRole('button', { name: 'تفاصيل: سفر' }));
    const input = screen.getByLabelText('خطوة جديدة');
    fireEvent.change(input, { target: { value: 'احجز التذكرة' } });
    fireEvent.click(screen.getByRole('button', { name: 'أضف خطوة' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'احجز التذكرة' }));
    fireEvent.change(screen.getByLabelText('خطوة جديدة'), { target: { value: 'جهّز الشنطة' } });
    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }));
    await screen.findByText('خطوات 1/2');
    expect((await allRecords(db))[0]?.steps).toHaveLength(2);
  });
});

describe('update banner', () => {
  it('shows only when a new version is waiting and applies it on click', async () => {
    const { updateSignal } = await import('@/app/updateSignal');
    render(<App db={db} now={now} today={today} />);
    expect(screen.queryByText('في نسخة جديدة من ناوي دو.')).toBeNull();
    let applied = 0;
    act(() => updateSignal.set(() => applied++));
    await screen.findByText('في نسخة جديدة من ناوي دو.');
    fireEvent.click(screen.getByRole('button', { name: 'حدّث' }));
    expect(applied).toBe(1);
    act(() => updateSignal.set(undefined));
  });
});
