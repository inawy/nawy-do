import type { Task } from '@/core/model';
import { formatDue, formatTime } from '../i18n/format';
import type { I18n } from '../i18n';

/** The task as plain text, for copying or sharing: title, when, notes, then the steps. */
export function taskText(task: Task, today: string, i18n: I18n, listName?: string): string {
  const { t } = i18n;
  const lines = [task.title];
  if (listName) lines.push(`${t('details.list')}: ${listName}`);
  if (task.due) {
    const time = task.dueTime ? ` ${formatTime(task.dueTime, i18n)}` : '';
    lines.push(`${t('details.due')}: ${formatDue(task.due, today, i18n)}${time}`);
  }
  if (task.notes) lines.push('', task.notes);
  if (task.steps?.length) {
    lines.push('');
    for (const s of task.steps)
      lines.push(`${s.level ? '    ' : ''}- [${s.done ? 'x' : ' '}] ${s.title}`);
  }
  return lines.join('\n');
}
