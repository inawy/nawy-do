import { intervalRepeat, type Task } from './types';

// A task as an iCalendar (.ics) event with an alarm, so the phone's calendar does the reminding
// (it works with the app closed and the screen locked). Pure: the caller supplies `stamp`, the UTC time as `YYYYMMDDTHHMMSSZ`.

const esc = (s: string): string =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, () => '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

/** Folds a line to 75 octets as RFC 5545 asks, never splitting a UTF-8 character. */
function fold(line: string): string {
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  const enc = new TextEncoder();
  for (const ch of line) {
    const size = enc.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const FREQ = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY', yearly: 'YEARLY' } as const;

function rrule(task: Task): string | undefined {
  if (!task.repeat) return undefined;
  const every =
    intervalRepeat(task.repeat) && task.repeatEvery ? `;INTERVAL=${task.repeatEvery}` : '';
  const base =
    task.repeat === 'workdays'
      ? 'FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH'
      : `FREQ=${FREQ[task.repeat]}${every}`;
  if (task.repeatUntil) {
    const day = task.repeatUntil.replace(/-/g, '');
    // UNTIL must have the same form as DTSTART: a date, or a (floating) date-time.
    return `${base};UNTIL=${task.dueTime === undefined ? day : `${day}T235959`}`;
  }
  return task.repeatTimes ? `${base};COUNT=${task.repeatTimes}` : base;
}

/** The calendar file for a task with a due date; `undefined` when it has none. */
export function taskToIcs(task: Task, stamp: string): string | undefined {
  if (!task.due) return undefined;
  const day = task.due.replace(/-/g, '');
  const timed = task.dueTime !== undefined;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nawy To Do//AR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${task.id}@nawy.do`,
    `DTSTAMP:${stamp}`,
    `SUMMARY:${esc(task.title)}`,
  ];
  const note = [
    task.notes,
    ...(task.steps ?? []).map((s) => `${s.done ? '[x]' : '[ ]'} ${s.title}`),
  ]
    .filter(Boolean)
    .join('\n');
  if (note) lines.push(`DESCRIPTION:${esc(note)}`);
  if (task.dueTime) {
    lines.push(`DTSTART:${day}T${task.dueTime.replace(':', '')}00`, 'DURATION:PT30M');
  } else lines.push(`DTSTART;VALUE=DATE:${day}`);
  const rule = rrule(task);
  if (rule) lines.push(`RRULE:${rule}`);
  lines.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(task.title)}`,
    // At the time itself; an all-day task rings at 09:00.
    timed ? 'TRIGGER;RELATED=START:PT0S' : 'TRIGGER;RELATED=START:PT9H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  );
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
