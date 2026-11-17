import { lazy, Suspense } from 'react';

export type IllustrationName = 'empty' | 'search' | 'trash' | 'inbox' | 'done';

const Art = lazy(() => import('./Art'));

/**
 * The picture for an empty state. Objects only, no people (see assets/illustrations/README.md);
 * colours come from the `--ill-*` tokens, so it follows the light, dark and black appearances.
 * The drawings load on first use (the service worker precaches them, so also offline); until
 * then an empty box of the same size keeps the layout from jumping.
 */
export function Illustration({ name }: { name: IllustrationName }) {
  return (
    <Suspense fallback={<div className="illustration ill-pending" aria-hidden="true" />}>
      <Art name={name} />
    </Suspense>
  );
}
