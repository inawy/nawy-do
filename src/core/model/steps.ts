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

/** Index ranges [start, end) of each top-level step together with the steps nested under it. */
function blocks(steps: readonly Step[]): [number, number][] {
  const out: [number, number][] = [];
  steps.forEach((s, i) => {
    const last = out[out.length - 1];
    if (s.level === 1 && last) last[1] = i + 1;
    else out.push([i, i + 1]);
  });
  return out;
}

/**
 * One position up (`-1`) or down (`1`). A top-level step moves as a block past the neighbouring
 * block; a nested step swaps with its sibling and never leaves its parent. `undefined` if there is
 * nowhere to go.
 */
export function moveStep(steps: readonly Step[], id: string, delta: -1 | 1): Step[] | undefined {
  const i = steps.findIndex((s) => s.id === id);
  const step = steps[i];
  if (!step) return undefined;
  if (step.level === 1) {
    const j = i + delta;
    if (steps[j]?.level !== 1) return undefined;
    const next = [...steps];
    [next[i], next[j]] = [next[j] as Step, next[i] as Step];
    return next;
  }
  const all = blocks(steps);
  const b = all.findIndex(([start]) => start === i);
  const other = all[b + delta];
  const mine = all[b];
  if (!mine || !other) return undefined;
  const [first, second] = delta === -1 ? [other, mine] : [mine, other];
  return [
    ...steps.slice(0, first[0]),
    ...steps.slice(second[0], second[1]),
    ...steps.slice(first[0], first[1]),
    ...steps.slice(second[1]),
  ];
}
