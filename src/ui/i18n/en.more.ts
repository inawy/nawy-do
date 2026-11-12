import type { arMore } from './ar.more';

/** More interface words (trash, task card, bulk delete), kept apart so each file stays short. */
export const enMore: Record<keyof typeof arMore, string> = {
  'composer.hint': 'You can type: tomorrow at 5 pm · every week · #list · !',
  'composer.read': 'What was read from the text',
  'composer.literal': 'Keep as typed',
  'delete.ask': 'Delete this task? It stays in the trash for {days} days and can be restored.',
  'delete.confirm': 'Confirm delete',
  'card.title': 'Task',
  'card.actions': 'Quick actions',
  'card.edit': 'Edit',
  'card.copy': 'Copy',
  'card.share': 'Share',
  'card.delete': 'Delete',
  'card.copied': 'Copied.',
  'menu.clearDone': 'Delete completed',
  'clearDone.ask':
    'Delete {count} completed tasks? They stay in the trash for {days} days and can be restored.',
  'menu.trash': 'Trash',
  'trash.title': 'Trash',
  'trash.hint':
    'Deleted tasks and lists stay here for {days} days, then they are removed for good.',
  'trash.empty': 'The trash is empty.',
  'trash.list': 'List: ',
  'trash.listsFull': 'You have reached the list limit. Delete a list first.',
  'trash.today': 'Deleted today',
  'trash.ago': 'Deleted {days} days ago',
  'trash.left': '{days} days left',
  'trash.restore': 'Restore',
  'trash.deleteOne': 'Delete forever: {name}',
  'trash.confirm': 'Confirm delete',
  'trash.emptyAll': 'Empty trash',
  'trash.confirmAll': 'Confirm empty trash',
};
