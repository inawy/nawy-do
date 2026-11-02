// What the app was opened for: the «new intention» shortcut, or text shared from another app
// (the manifest's share_target sends share_title / share_text / share_url). Pure: it only reads a
// query string.

export interface Launch {
  /** Opened by the «نية جديدة» shortcut: focus the add field. */
  newTask: boolean;
  /** Text shared from another app, as one title (undefined when nothing usable was shared). */
  shared: string | undefined;
}

const MAX_SHARED = 1000;

export function parseLaunch(search: string): Launch {
  const q = new URLSearchParams(search);
  const all = ['share_title', 'share_text', 'share_url']
    .map((key) => (q.get(key) ?? '').replace(/\s+/g, ' ').trim())
    .filter((v) => v !== '');
  // Android often repeats the title inside the text, or the URL inside the text: keep the longer.
  const parts = all.filter(
    (v, i) => !all.some((o, j) => j !== i && o.includes(v) && (o !== v || j < i)),
  );
  const joined = parts.join(' ').slice(0, MAX_SHARED).trim();
  return { newTask: q.get('new') === '1', shared: joined === '' ? undefined : joined };
}
