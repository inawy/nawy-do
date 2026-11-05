import { useCallback, useState } from 'react';
import { loadLastExport, saveLastExport } from './prefs';

/** When a backup file was last taken on this device, and a way to record that one just was. */
export function useExportLog(now: () => number) {
  const [last, setLast] = useState(loadLastExport);
  const mark = useCallback(() => {
    const at = now();
    saveLastExport(at);
    setLast(at);
  }, [now]);
  return { last, mark };
}
