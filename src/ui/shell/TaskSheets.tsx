import { useState } from 'react';
import type { Task, TaskList, TaskPatch } from '@/core/model';
import { DetailsSheet, TaskCard } from '../details';

interface Props {
  task: Task;
  lists: TaskList[];
  today: string;
  newId: () => string;
  onSave: (patch: TaskPatch) => void;
  onRemove: () => void;
  onClose: () => void;
  onCopy: (text: string) => Promise<boolean>;
  onShare?: ((title: string, text: string) => Promise<boolean>) | undefined;
}

/** A tap on a task opens its card; «Edit» on the card opens the full form for the same task. */
export function TaskSheets(p: Props) {
  const [editing, setEditing] = useState(false);
  const remove = () => {
    p.onRemove();
    p.onClose();
  };
  return editing ? (
    <DetailsSheet
      task={p.task}
      lists={p.lists}
      today={p.today}
      newId={p.newId}
      onSave={p.onSave}
      onRemove={remove}
      onClose={p.onClose}
    />
  ) : (
    <TaskCard
      task={p.task}
      lists={p.lists}
      today={p.today}
      onSave={p.onSave}
      onEdit={() => setEditing(true)}
      onRemove={remove}
      onClose={p.onClose}
      onCopy={p.onCopy}
      onShare={p.onShare}
    />
  );
}
