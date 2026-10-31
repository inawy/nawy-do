import { useEffect, useRef } from 'react';
import { CloseIcon } from '../primitives';

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
  onImport: (file: File) => void;
  onRestore: (id: number) => void;
  onClose: () => void;
}

const ERRORS: Record<string, string> = {
  'not-json': 'الملف مش ملف نسخة احتياطية سليم.',
  'not-an-envelope': 'الملف مش ملف نسخة احتياطية سليم.',
  'wrong-app': 'الملف ده مش من ناوي دو.',
  'newer-version': 'الملف من نسخة أحدث من التطبيق. حدّث التطبيق وجرّب تاني.',
  'too-many-records': 'الملف كبير أكتر من اللازم.',
  'too-big': 'الملف كبير أكتر من اللازم.',
  failed: 'حصلت مشكلة وماحفظتش حاجة. جرّب تاني.',
};

export function describeOutcome(o: Outcome): string {
  switch (o.kind) {
    case 'exported':
      return 'نزّلت النسخة الاحتياطية.';
    case 'imported':
      return o.changed === 0
        ? 'كل اللي في الملف موجود عندك بالفعل.'
        : `استوردت ${o.changed} من ${o.total}. بياناتك الحالية اتدمجت معاها ومتمسحش منها حاجة.`;
    case 'restored':
      return o.changed === 0
        ? 'النسخة دي موجودة عندك بالفعل.'
        : `رجّعت ${o.changed} عنصر من النسخة. بياناتك الحالية اتدمجت معاها.`;
    case 'error':
      return ERRORS[o.code] ?? 'الملف ده مش سليم، ومحصلش أي تغيير.';
  }
}

/** Backup file out and in, and the safety copies taken before an upgrade. Nothing here deletes. */
export function BackupSheet({
  storage,
  snapshots,
  outcome,
  onExport,
  onImport,
  onRestore,
  onClose,
}: Props) {
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="بياناتي"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <h2 className="sheet-heading">بياناتي</h2>
          <button type="button" className="icon" aria-label="إغلاق" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <p className="hint">كل نواياك محفوظة على جهازك بس. خُد نسخة احتياطية تحفظها عندك.</p>
        {storage === 'persisted' ? (
          <p className="form-ok">التخزين محمي من المسح التلقائي.</p>
        ) : storage === 'best-effort' || storage === 'unsupported' ? (
          <p className="form-warn">
            المتصفح ممكن يمسح بيانات الموقع لو الجهاز ضاق. ثبّت التطبيق على الشاشة الرئيسية وخُد
            نسخة احتياطية بانتظام.
          </p>
        ) : null}
        <div className="actions data-actions">
          <button type="button" className="primary" onClick={onExport}>
            تنزيل نسخة احتياطية
          </button>
          <button type="button" onClick={() => file.current?.click()}>
            استيراد من ملف
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            aria-label="ملف النسخة الاحتياطية"
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
            {describeOutcome(outcome)}
          </p>
        )}
        {snapshots.length > 0 && (
          <section className="snapshots">
            <h3>نسخ أمان قبل التحديثات</h3>
            <p className="hint">
              التطبيق بياخد نسخة تلقائيًا قبل ما يغيّر شكل التخزين. الاسترجاع بيدمجها مع بياناتك
              الحالية.
            </p>
            <ul>
              {snapshots.map((s) => (
                <li key={s.id}>
                  <span>{s.label}</span>
                  <button type="button" onClick={() => onRestore(s.id)}>
                    استرجاع
                    <span className="sr-only"> نسخة {s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
