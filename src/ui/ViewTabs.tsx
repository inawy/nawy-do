export type View = 'all' | 'scheduled';

const TABS: { id: View; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'scheduled', label: 'مجدولة' },
];

export function ViewTabs({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="tabs" role="group" aria-label="العرض">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-pressed={view === t.id}
          className={view === t.id ? 'tab on' : 'tab'}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
