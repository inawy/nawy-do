import type { Task } from '@/core/model';
import { formatDue, formatTime } from '../i18n/format';
import type { I18n } from '../i18n';

/** A view as Markdown: a heading, then a checklist (open first), with notes and steps under each. */
export function listText(title: string, tasks: readonly Task[], today: string, i18n: I18n): string {
  const open = tasks.filter((x) => x.status !== 'done');
  const done = tasks.filter((x) => x.status === 'done');
  const lines = [`# ${title}`, ''];
  for (const task of [...open, ...done]) {
    const when = task.due
      ? ` — ${formatDue(task.due, today, i18n)}${task.dueTime ? ` ${formatTime(task.dueTime, i18n)}` : ''}`
      : '';
    lines.push(`- [${task.status === 'done' ? 'x' : ' '}] ${task.title}${when}`);
    for (const s of task.steps ?? []) {
      lines.push(`${s.level ? '    ' : '  '}- [${s.done ? 'x' : ' '}] ${s.title}`);
    }
    if (task.notes) for (const n of task.notes.split('\n')) lines.push(`  > ${n}`);
  }
  return lines.join('\n');
}
