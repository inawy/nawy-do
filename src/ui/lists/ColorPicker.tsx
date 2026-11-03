import { LIST_COLORS, type ListColor } from '@/core/model';

const LABEL: Record<ListColor, string> = {
  blue: 'أزرق',
  green: 'أخضر',
  amber: 'برتقالي',
  red: 'أحمر',
  purple: 'بنفسجي',
  teal: 'فيروزي',
  pink: 'وردي',
  gray: 'رمادي',
};

interface Props {
  /** `''` = no colour. */
  value: ListColor | '';
  onChange: (color: ListColor | '') => void;
}

/** The list colour: a row of 48dp swatches (one choice). Choosing the current one clears it. */
export function ColorPicker({ value, onChange }: Props) {
  return (
    <fieldset className="colors">
      <legend>اللون</legend>
      <div role="radiogroup" aria-label="لون القائمة" className="color-row">
        {LIST_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value === c}
            aria-label={LABEL[c]}
            className="swatch"
            data-list-color={c}
            onClick={() => onChange(value === c ? '' : c)}
          />
        ))}
      </div>
    </fieldset>
  );
}
