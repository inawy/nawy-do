import {
  intervalRepeat,
  MAX_REPEAT_EVERY,
  MAX_REPEAT_TIMES,
  REPEATS,
  type Repeat,
} from '@/core/model';
import { useT } from '../i18n';
import { Field, Select, TextInput } from '../primitives';

export interface RepeatEnd {
  /** The date the repeat stops after, or `''`. */
  until: string;
  /** How many occurrences in all, or `0`. */
  times: number;
}

interface Props {
  disabled: boolean;
  repeat: Repeat | '';
  every: number;
  due: string;
  end: RepeatEnd;
  onRepeat: (repeat: Repeat | '') => void;
  onEvery: (every: number) => void;
  onEnd: (end: RepeatEnd) => void;
}

type Kind = 'never' | 'until' | 'times';
const kindOf = (end: RepeatEnd): Kind =>
  end.until !== '' ? 'until' : end.times > 0 ? 'times' : 'never';

/**
 * The repeat choice and what goes with it: «every N» for the kinds that allow it (2 = every other
 * one), and when the repeat stops: never, after a date, or after a number of times.
 */
export function RepeatFields({
  disabled,
  repeat,
  every,
  due,
  end,
  onRepeat,
  onEvery,
  onEnd,
}: Props) {
  const t = useT();
  const kind = kindOf(end);
  const setKind = (k: Kind) =>
    onEnd(
      k === 'until'
        ? { until: due, times: 0 }
        : k === 'times'
          ? { until: '', times: 2 }
          : { until: '', times: 0 },
    );
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
      {!disabled && repeat !== '' && (
        <>
          <Field label={t('details.repeatEnd')}>
            <Select
              aria-label={t('details.repeatEnd')}
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
            >
              <option value="never">{t('details.endNever')}</option>
              <option value="until">{t('details.endUntil')}</option>
              <option value="times">{t('details.endTimes')}</option>
            </Select>
          </Field>
          {kind === 'until' && (
            <Field label={t('details.endUntil')}>
              <TextInput
                type="date"
                min={due}
                value={end.until}
                onChange={(e) => onEnd({ until: e.target.value, times: 0 })}
              />
            </Field>
          )}
          {kind === 'times' && (
            <Field label={t('details.endTimes')}>
              <TextInput
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_REPEAT_TIMES}
                value={end.times}
                onChange={(e) => {
                  const n = Math.floor(Number(e.target.value));
                  onEnd({
                    until: '',
                    times: Number.isFinite(n) ? Math.min(MAX_REPEAT_TIMES, Math.max(1, n)) : 1,
                  });
                }}
              />
            </Field>
          )}
        </>
      )}
    </>
  );
}
