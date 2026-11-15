import { intervalRepeat, MAX_REPEAT_EVERY, REPEATS, type Repeat } from '@/core/model';
import { useT } from '../i18n';
import { Field, Select, TextInput } from '../primitives';

interface Props {
  disabled: boolean;
  repeat: Repeat | '';
  every: number;
  onRepeat: (repeat: Repeat | '') => void;
  onEvery: (every: number) => void;
}

/** The repeat choice and, for the kinds that allow it, «every N» (2 = every other one). */
export function RepeatFields({ disabled, repeat, every, onRepeat, onEvery }: Props) {
  const t = useT();
  return (
    <>
      <Field label={t('details.repeat')}>
        <Select
          aria-label={t('details.repeat')}
          value={disabled ? '' : repeat}
          disabled={disabled}
          onChange={(e) => onRepeat(REPEATS.find((r) => r === e.target.value) ?? '')}
        >
          <option value="">{t('details.noRepeat')}</option>
          {REPEATS.map((r) => (
            <option key={r} value={r}>
              {t(`repeat.${r}`)}
            </option>
          ))}
        </Select>
      </Field>
      {!disabled && intervalRepeat(repeat === '' ? undefined : repeat) && (
        <Field label={t('details.every')}>
          <TextInput
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_REPEAT_EVERY}
            value={every}
            onChange={(e) => {
              const n = Math.floor(Number(e.target.value));
              onEvery(Number.isFinite(n) ? Math.min(MAX_REPEAT_EVERY, Math.max(1, n)) : 1);
            }}
          />
        </Field>
      )}
    </>
  );
}
