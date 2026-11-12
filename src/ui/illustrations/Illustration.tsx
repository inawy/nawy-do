import type { FunctionComponent, SVGProps } from 'react';
import DoneSvg from '../../assets/illustrations/done.svg?react';
import EmptySvg from '../../assets/illustrations/empty.svg?react';
import InboxSvg from '../../assets/illustrations/inbox.svg?react';
import SearchSvg from '../../assets/illustrations/search.svg?react';
import TrashSvg from '../../assets/illustrations/trash.svg?react';

export type IllustrationName = 'empty' | 'search' | 'trash' | 'inbox' | 'done';

const ART: Record<IllustrationName, FunctionComponent<SVGProps<SVGSVGElement>>> = {
  empty: EmptySvg,
  search: SearchSvg,
  trash: TrashSvg,
  inbox: InboxSvg,
  done: DoneSvg,
};

/**
 * The picture for an empty state. Objects only, no people (see assets/illustrations/README.md);
 * colours come from the `--ill-*` tokens, so it follows the light, dark and black appearances.
 */
export function Illustration({ name }: { name: IllustrationName }) {
  const Art = ART[name];
  return <Art className={`illustration ill-${name}`} width="240" height="180" />;
}
