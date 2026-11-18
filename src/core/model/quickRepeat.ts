import type { Repeat } from './types';

// The repeat phrases of smart quick-add, on text already normalised (see `normalise`):
// «كل أسبوع», «كل 3 أيام», «كل يومين», «every 2 weeks».

const B = String.raw`(?<![\p{L}\p{N}])`;
const E = String.raw`(?![\p{L}\p{N}])`;
const re = (src: string) => new RegExp(`${B}(?:${src})${E}`, 'iu');

const UNITS: [Repeat, string][] = [
  ['daily', 'يوم|ايام|days?'],
  ['weekly', 'اسبوع|اسابيع|weeks?'],
  ['monthly', 'شهر|اشهر|شهور|months?'],
  ['yearly', 'سنه|سنين|سنوات|عام|اعوام|years?'],
];
/** The dual forms: «كل يومين» is every 2 days. */
const DUALS: [Repeat, string][] = [
  ['daily', 'يومين'],
  ['weekly', 'اسبوعين'],
  ['monthly', 'شهرين'],
  ['yearly', 'سنتين|عامين'],
];

const PLAIN: [Repeat, string][] = [
  ['daily', 'كل يوم|يوميا|every\\s+day|daily'],
  ['weekly', 'كل اسبوع|اسبوعيا|every\\s+week|weekly'],
  ['monthly', 'كل شهر|شهريا|every\\s+month|monthly'],
  ['yearly', 'كل سنه|كل عام|سنويا|every\\s+year|yearly|annually'],
];

export interface RepeatRead {
  repeat: Repeat;
  /** 2–99 for «every N», absent for a plain repeat. */
  every?: number;
  start: number;
  end: number;
}

/** The repeat phrase in `n`, with its position, or `null`. «كل 3 أيام» is tried before «كل يوم». */
export function readRepeat(n: string): RepeatRead | null {
  for (const [repeat, unit] of UNITS) {
    const m = re(String.raw`(?:كل|every)\s+(\d{1,2})\s+(?:${unit})`).exec(n);
    const k = Number(m?.[1]);
    if (m && k >= 2) return { repeat, every: k, start: m.index, end: m.index + m[0].length };
  }
  for (const [repeat, dual] of DUALS) {
    const m = re(String.raw`كل\s+(?:${dual})`).exec(n);
    if (m) return { repeat, every: 2, start: m.index, end: m.index + m[0].length };
  }
  for (const [repeat, src] of PLAIN) {
    const m = re(src).exec(n);
    if (m) return { repeat, start: m.index, end: m.index + m[0].length };
  }
  return null;
}
