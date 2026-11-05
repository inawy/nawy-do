import type { Step } from './types';

/** Can this step be indented under the one before it? Not the first, not one that has nested steps. */
export function canIndent(steps: readonly Step[], id: string): boolean {
  const i = steps.findIndex((s) => s.id === id);
  const step = steps[i];
  if (!step || i === 0 || step.level === 1) return false;
  return steps[i + 1]?.level !== 1;
}

/** Indents (`level: 1`) or lifts (`level: undefined`) one step; anything not allowed changes nothing. */
export function setStepLevel(steps: readonly Step[], id: string, level: 1 | undefined): Step[] {
  if (level === 1 && !canIndent(steps, id)) return [...steps];
  return steps.map((s) => {
    if (s.id !== id) return s;
    const plain: Step = { id: s.id, title: s.title, done: s.done };
    return level === 1 ? { ...plain, level } : plain;
  });
}
