import type { Task } from '@/core/model';
import type { MessageKey, Params } from './index';

/** «كل أسبوع» or, with an interval, «كل 2 أسبوع». */
export function repeatLabel(
  task: Pick<Task, 'repeat' | 'repeatEvery'>,
  t: (key: MessageKey, params?: Params) => string,
  num: (n: number) => string = String,
): string | undefined {
  if (!task.repeat) return undefined;
  if (task.repeatEvery && task.repeatEvery > 1 && task.repeat !== 'workdays') {
    return t(`repeatEvery.${task.repeat}`, { n: num(task.repeatEvery) });
  }
  return t(`repeat.${task.repeat}`);
}
