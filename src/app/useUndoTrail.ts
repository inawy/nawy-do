import { useEffect, useRef, useState } from 'react';

export type UndoKind = 'task' | 'list';

/**
 * Remembers in which order tasks and lists were deleted, so "undo" restores the newest deletion
 * whatever it was. Each feature keeps its own stack; this only notices a new deletion appearing
 * on top of one (an object it has not seen). Dismissing the toast just hides it: the deletions
 * stay undoable, and the next deletion shows it again.
 */
export function useUndoTrail(lastTask: object | null, lastList: object | null) {
  const [trail, setTrail] = useState<UndoKind[]>([]);
  const [hidden, setHidden] = useState(false);
  const known = useRef(new WeakSet<object>());

  useEffect(() => {
    const fresh: UndoKind[] = [];
    if (lastTask && !known.current.has(lastTask)) fresh.push('task');
    if (lastList && !known.current.has(lastList)) fresh.push('list');
    if (lastTask) known.current.add(lastTask);
    if (lastList) known.current.add(lastList);
    if (fresh.length > 0) {
      setTrail((t) => [...t, ...fresh]);
      setHidden(false);
    }
  }, [lastTask, lastList]);

  const has = { task: lastTask !== null, list: lastList !== null };
  // The newest deletion whose feature still has something to restore.
  const live = trail.filter((k) => has[k]);
  const newest = live[live.length - 1] ?? (has.list ? 'list' : has.task ? 'task' : undefined);
  return {
    newest: hidden ? undefined : newest,
    /** Forget the newest entry (call as its undo runs). */
    popped: () => setTrail((t) => t.slice(0, -1)),
    hide: () => setHidden(true),
  };
}
