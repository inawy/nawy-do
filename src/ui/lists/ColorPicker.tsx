import { LIST_COLORS, type ListColor } from '@/core/model';
import { useT } from '../i18n';

interface Props {
  /** `''` = no colour. */
  value: ListColor | '';
  onChange: (color: ListColor | '') => void;
}

/** The list colour: a row of 48dp swatches (one choice). Choosing the current one clears it. */
export function ColorPicker({ value, onChange }: Props) {
  const t = useT();
  return (
    <fieldset className="colors">
      <legend>{t('color.legend')}</legend>
      <div role="radiogroup" aria-label={t('color.group')} className="color-row">
        {LIST_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value === c}
            aria-label={t(`color.${c}`)}
            className="swatch"
            data-list-color={c}
            onClick={() => onChange(value === c ? '' : c)}
          />
        ))}
      </div>
    </fieldset>
  );
}
