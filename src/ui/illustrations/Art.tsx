import type { FunctionComponent, SVGProps } from 'react';
import DoneSvg from '../../assets/illustrations/done.svg?react';
import EmptySvg from '../../assets/illustrations/empty.svg?react';
import InboxSvg from '../../assets/illustrations/inbox.svg?react';
import SearchSvg from '../../assets/illustrations/search.svg?react';
import TrashSvg from '../../assets/illustrations/trash.svg?react';

import type { IllustrationName } from './Illustration';

const ART: Record<IllustrationName, FunctionComponent<SVGProps<SVGSVGElement>>> = {
  empty: EmptySvg,
  search: SearchSvg,
  trash: TrashSvg,
  inbox: InboxSvg,
  done: DoneSvg,
};

/** The picture itself; loaded on demand by `Illustration` (it is only shown in empty states). */
export default function Art({ name }: { name: IllustrationName }) {
  const Svg = ART[name];
  return <Svg className={`illustration ill-${name}`} width="240" height="180" />;
}
