import { useRef } from 'react';
import { Button, CloseIcon, IconButton } from '../primitives';
import { useI18n, type MessageKey, type Params } from '../i18n';
import { Sheet } from '../sheet';

export type Outcome =
  | { kind: 'exported' }
  | { kind: 'imported'; total: number; changed: number }
  | { kind: 'restored'; changed: number }
  | { kind: 'error'; code: string };

export interface SnapshotItem {
  id: number;
  /** Already formatted for display. */
  label: string;
}

export type StorageStatus = 'persisted' | 'best-effort' | 'unsupported' | 'unknown';

interface Props {
  storage: StorageStatus;
  snapshots: SnapshotItem[];
  outcome: Outcome | null;
  onExport: () => void;
  onShare?: () => void;
  lastExport?: string;
  onImport: (file: File) => void;
  onRestore: (id: number) => void;
  onClose: () => void;
}

const ERRORS: Record<string, MessageKey> = {
  'not-json': 'backup.err.badFile',
  'not-an-envelope': 'backup.err.badFile',
  'wrong-app': 'backup.err.wrongApp',
  'newer-version': 'backup.err.newer',
  'too-many-records': 'backup.err.big',
  'too-big': 'backup.err.big',
  failed: 'backup.err.failed',
};

type Translate = (key: MessageKey, params?: Params) => string;

export function describeOutcome(o: Outcome, t: Translate, num: (n: number) => string): string {
  switch (o.kind) {
    case 'exported':
      return t('backup.exported');
    case 'imported':
      return o.changed === 0
        ? t('backup.importedNone')
        : t('backup.imported', { changed: num(o.changed), total: num(o.total) });
    case 'restored':
      return o.changed === 0
        ? t('backup.restoredNone')
        : t('backup.restored', { changed: num(o.changed) });
    case 'error':
      return t(ERRORS[o.code] ?? 'backup.err.unknown');
  }
}

/** Backup file out and in, and the safety copies taken before an upgrade. Nothing here deletes. */
export function BackupSheet({
  storage,
  snapshots,
  outcome,
  onExport,
  onShare,
  lastExport,
  onImport,
  onRestore,
  onClose,
}: Props) {
  const file = useRef<HTMLInputElement>(null);
  const { t, num } = useI18n();

  return (
    <Sheet label={t('backup.title')} onClose={onClose}>
      <div className="sheet-head">
        <h2 className="sheet-heading">{t('backup.title')}</h2>
        <IconButton label={t('common.close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <p className="hint">{t('backup.intro')}</p>
      {storage === 'persisted' ? (
        <p className="form-ok">{t('backup.persisted')}</p>
      ) : storage === 'best-effort' || storage === 'unsupported' ? (
        <p className="form-warn">{t('backup.bestEffort')}</p>
      ) : null}
      <p className="hint">
        {lastExport ? t('backup.last', { when: lastExport }) : t('backup.never')}
      </p>
      <div className="actions data-actions">
        <Button variant="primary" onClick={onExport}>
          {t('backup.export')}
        </Button>
        {onShare && <Button onClick={onShare}>{t('backup.share')}</Button>}
        <Button onClick={() => file.current?.click()}>{t('backup.import')}</Button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label={t('backup.fileLabel')}
          onChange={(e) => {
            const picked = e.target.files?.[0];
            e.target.value = '';
            if (picked) onImport(picked);
          }}
        />
      </div>
      {outcome && (
        <p
          className={outcome.kind === 'error' ? 'form-error' : 'form-ok'}
          role={outcome.kind === 'error' ? 'alert' : 'status'}
        >
          {describeOutcome(outcome, t, num)}
        </p>
      )}
      {snapshots.length > 0 && (
        <section className="snapshots">
          <h3>{t('backup.snapshots')}</h3>
          <p className="hint">{t('backup.snapshotsHint')}</p>
          <ul>
            {snapshots.map((s) => (
              <li key={s.id}>
                <span>{s.label}</span>
                <Button onClick={() => onRestore(s.id)}>
                  {t('backup.restore')}
                  <span className="sr-only"> {t('backup.restoreSr', { label: s.label })}</span>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Sheet>
  );
}
