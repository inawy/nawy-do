import { REMIND_MINUTES } from '@/core/model';
import { useT } from '../i18n';
import { Field, Select } from '../primitives';

/** How long before its time a task reminds: at the time, or a few minutes/hours/a day before. */
export function RemindField({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  const t = useT();
  return (
    <Field label={t('details.remind')}>
      <Select
        aria-label={t('details.remind')}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {REMIND_MINUTES.map((m) => (
          <option key={m} value={m}>
            {t(`remind.${m}`)}
          </option>
        ))}
      </Select>
    </Field>
  );
}
