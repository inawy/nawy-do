import { useCallback, useState } from 'react';
import { type EnvelopeError } from '@/core/model';
import type { BackupRepository, SafetyCopy } from '@/core/ports';

/** What the last data action did; the UI turns it into words. */
export type BackupOutcome =
  | { kind: 'exported' }
  | { kind: 'imported'; total: number; changed: number }
  | { kind: 'restored'; changed: number }
  | { kind: 'error'; code: EnvelopeError['code'] | 'too-big' | 'failed' };

export interface SnapshotInfo {
  id: number;
  createdAt: number;
  fromVersion: number;
}

export interface BackupApi {
  snapshots: SnapshotInfo[];
  outcome: BackupOutcome | null;
  /** Reloads the safety copies and clears the last outcome (called when the sheet opens). */
  refresh: () => Promise<void>;
  /** The backup file's text. */
  exportJson: () => Promise<string>;
  /** Merges a backup file's text into the data. A bad file changes nothing. */
  importText: (text: string) => Promise<void>;
  restore: (id: number) => Promise<void>;
}

const MAX_FILE_CHARS = 20_000_000;
const info = (s: SafetyCopy): SnapshotInfo => ({
  id: s.id as number,
  createdAt: s.createdAt,
  fromVersion: s.fromVersion,
});

/** Export, import and the pre-upgrade safety copies. `now` is injected (D-005). */
export function useBackup(repo: BackupRepository, now: () => number): BackupApi {
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [copies, setCopies] = useState<SafetyCopy[]>([]);
  const [outcome, setOutcome] = useState<BackupOutcome | null>(null);

  const refresh = useCallback(async () => {
    setOutcome(null);
    try {
      const all = await repo.safetyCopies();
      setCopies(all);
      setSnapshots(all.map(info));
    } catch {
      setSnapshots([]);
    }
  }, []);

  const exportJson = useCallback(async () => {
    const text = await repo.export(now());
    setOutcome({ kind: 'exported' });
    return text;
  }, [repo, now]);

  const run = useCallback(
    async (text: string, restored: boolean) => {
      if (text.length > MAX_FILE_CHARS) return setOutcome({ kind: 'error', code: 'too-big' });
      try {
        const result = await repo.import(text, { now: now() });
        if (!result.ok) return setOutcome({ kind: 'error', code: result.error.code });
        const changed = result.value.changed + result.value.listsChanged;
        setOutcome(
          restored
            ? { kind: 'restored', changed }
            : { kind: 'imported', total: result.value.total + result.value.lists, changed },
        );
      } catch {
        setOutcome({ kind: 'error', code: 'failed' });
      }
    },
    [repo, now],
  );

  const importText = useCallback((text: string) => run(text, false), [run]);
  const restore = useCallback(
    async (id: number) => {
      const copy = copies.find((c) => c.id === id);
      if (copy) await run(copy.json, true);
    },
    [copies, run],
  );

  return { snapshots, outcome, refresh, exportJson, importText, restore };
}
