import { lazy } from 'react';

// Sheets that are opened rarely load on first use. Their files are precached by the service
// worker, so they open offline too; the first screen just parses less.
export const TrashSheet = lazy(() => import('../trash').then((m) => ({ default: m.TrashSheet })));
export const BackupSheet = lazy(() =>
  import('../backup').then((m) => ({ default: m.BackupSheet })),
);
export const ExportSheet = lazy(() =>
  import('./ExportSheet').then((m) => ({ default: m.ExportSheet })),
);
export const ShortcutsSheet = lazy(() =>
  import('./ShortcutsSheet').then((m) => ({ default: m.ShortcutsSheet })),
);
