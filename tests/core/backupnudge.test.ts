import { describe, expect, it } from 'vitest';
import { NUDGE_AFTER_DAYS, NUDGE_MIN_TASKS, needsBackupNudge } from '@/core/model';

const DAY = 86_400_000;
const NOW = 100 * DAY;

describe('needsBackupNudge', () => {
  it('stays quiet while there is little to lose', () => {
    expect(needsBackupNudge(undefined, NOW, NUDGE_MIN_TASKS - 1)).toBe(false);
  });

  it('asks when no backup was ever taken', () => {
    expect(needsBackupNudge(undefined, NOW, NUDGE_MIN_TASKS)).toBe(true);
  });

  it('asks only after the period has passed', () => {
    expect(needsBackupNudge(NOW - (NUDGE_AFTER_DAYS - 1) * DAY, NOW, 20)).toBe(false);
    expect(needsBackupNudge(NOW - (NUDGE_AFTER_DAYS + 1) * DAY, NOW, 20)).toBe(true);
  });
});
