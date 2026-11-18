import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTask, type Task } from '@/core/model';
import { I18nProvider } from '@/ui/i18n';
import { TaskRow } from '@/ui/tasks/TaskRow';

const base = (): Task => ({ ...createTask('a', 'دواء', 100), due: '2026-11-03', repeat: 'daily' });

function row(task: Task, onToggle: (t: Task) => void) {
  return (
    <I18nProvider lang="ar">
      <ul>
        <TaskRow
          task={task}
          today="2026-11-03"
          onToggle={onToggle}
          onStar={() => {}}
          onOpen={() => {}}
        />
      </ul>
    </I18nProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  // A phone with animations on: the fade-and-collapse plays before the task is completed.
  window.matchMedia = ((q: string) => ({ matches: false, media: q })) as typeof window.matchMedia;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  // @ts-expect-error restore the jsdom default (no matchMedia)
  delete window.matchMedia;
});

describe('TaskRow completing', () => {
  it('a repeating task fades out, then comes back once it has moved to its next date', () => {
    const onToggle = vi.fn();
    const task = base();
    const view = render(row(task, onToggle));
    fireEvent.click(screen.getByRole('checkbox'));
    expect(document.querySelector('li.row')?.classList.contains('leaving')).toBe(true);
    act(() => void vi.advanceTimersByTime(300));
    expect(onToggle).toHaveBeenCalledTimes(1);
    // The data layer saved the next occurrence: same task, new date and version.
    view.rerender(row({ ...task, due: '2026-11-04', updatedAt: task.updatedAt + 1 }, onToggle));
    expect(document.querySelector('li.row')?.classList.contains('leaving')).toBe(false);
  });
});
