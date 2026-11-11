/** Browser file helpers: the only place that touches Blob URLs and anchors. */
export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  // Revoke after the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const jsonFile = (filename: string, text: string) =>
  new File([text], filename, { type: 'application/json' });

/** Can this browser hand a file to the system share sheet (save to Drive, send to oneself...)? */
export function canShareFile(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false;
  try {
    return navigator.canShare({ files: [jsonFile('x.json', '{}')] });
  } catch {
    return false;
  }
}

/** Shares the file through the system sheet. False if the person cancelled or it failed. */
export async function shareText(filename: string, text: string): Promise<boolean> {
  try {
    await navigator.share({ files: [jsonFile(filename, text)], title: filename });
    return true;
  } catch {
    return false;
  }
}

/** Copies text to the clipboard. False if the browser refused. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Can this browser open the system share sheet for text? */
export const canShareText = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function';

/** Shares text through the system sheet. False if the person cancelled or it failed. */
export async function shareTextOnly(title: string, text: string): Promise<boolean> {
  try {
    await navigator.share({ title, text });
    return true;
  } catch {
    return false;
  }
}
