// Icons are the real Google Material Symbols (Outlined) SVG files in src/assets/icons, unmodified
// (source and license: that folder's README and LICENSE; rule: inawy/design-system ADR 0002).
// `vite-plugin-svgr` turns each into a component; fill/aria come from the svgr config in
// vite.config.ts (currentColor, aria-hidden), so icons take the colour of the text around them.
import AddSvg from '../../assets/icons/add.svg?react';
import CalendarSvg from '../../assets/icons/calendar_month.svg?react';
import CloseSvg from '../../assets/icons/close.svg?react';
import DeleteSvg from '../../assets/icons/delete.svg?react';
import DownloadSvg from '../../assets/icons/download.svg?react';
import DragSvg from '../../assets/icons/drag_indicator.svg?react';
import ExpandSvg from '../../assets/icons/expand_more.svg?react';
import ListSvg from '../../assets/icons/format_list_bulleted.svg?react';
import MoreSvg from '../../assets/icons/more_vert.svg?react';
import SearchSvg from '../../assets/icons/search.svg?react';
import StarSvg from '../../assets/icons/star.svg?react';
import StarFilledSvg from '../../assets/icons/star_fill1.svg?react';
import TodaySvg from '../../assets/icons/today.svg?react';
import TaskSvg from '../../assets/icons/task_alt.svg?react';

export const PlusIcon = () => <AddSvg />;
export const StarIcon = ({ on }: { on: boolean }) => (on ? <StarFilledSvg /> : <StarSvg />);
export const AllIcon = () => <TaskSvg />;
export const StarredNavIcon = () => <StarFilledSvg />;
export const TodayIcon = () => <TodaySvg />;
export const CalendarIcon = () => <CalendarSvg />;
export const ChevronIcon = () => <ExpandSvg />;
export const TrashIcon = () => <DeleteSvg />;
export const GripIcon = () => <DragSvg />;
export const ListIcon = () => <ListSvg />;
export const MoreIcon = () => <MoreSvg />;
export const CloseIcon = () => <CloseSvg />;
export const DataIcon = () => <DownloadSvg />;
export const SearchIcon = () => <SearchSvg />;
