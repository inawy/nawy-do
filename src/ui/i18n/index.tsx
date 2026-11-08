import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { ar, type MessageKey } from './ar';
import { en } from './en';

export type Lang = 'ar' | 'en';
export const LANGS: readonly Lang[] = ['ar', 'en'];
export type { MessageKey };

const DICTIONARY: Record<Lang, Record<MessageKey, string>> = { ar, en };
const DIRECTION: Record<Lang, 'rtl' | 'ltr'> = { ar: 'rtl', en: 'ltr' };

export type Params = Record<string, string | number>;

/** Fills `{name}` placeholders. A placeholder with no value is left visible, never silently empty. */
export function format(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    params[name] === undefined ? whole : String(params[name]),
  );
}

export interface I18n {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  t: (key: MessageKey, params?: Params) => string;
  /** A count, in Western digits in both languages (as the interface always showed them). */
  num: (n: number) => string;
  /** Switches the interface language; absent where nothing can persist the choice. */
  setLang?: ((lang: Lang) => void) | undefined;
}

export function makeI18n(lang: Lang): I18n {
  const words = DICTIONARY[lang];
  return {
    lang,
    dir: DIRECTION[lang],
    t: (key, params) => format(words[key], params),
    num: (n) => n.toLocaleString('en-US'),
  };
}

// No provider (a bare component in a test, say) means the product language.
const Context = createContext<I18n>(makeI18n('ar'));

export function I18nProvider({
  lang,
  onLang,
  children,
}: {
  lang: Lang;
  onLang?: (lang: Lang) => void;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ ...makeI18n(lang), setLang: onLang }), [lang, onLang]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = value.dir;
  }, [lang, value.dir]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useI18n = (): I18n => useContext(Context);
export const useT = (): I18n['t'] => useContext(Context).t;

export const isLang = (v: unknown): v is Lang => LANGS.some((l) => l === v);
