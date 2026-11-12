import type { ListColor } from './types';

/** One thing in the trash: a deleted task or a deleted list (ADR 0042). */
export interface TrashEntry {
  kind: 'task' | 'list';
  id: string;
  title: string;
  deletedAt: number;
  color?: ListColor | undefined;
}
