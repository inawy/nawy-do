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
