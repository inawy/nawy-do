import { useState } from 'react';
import type { Task } from '@/core/model';
import { listText } from '../details/listText';
import { useI18n } from '../i18n';
import { Button, CloseIcon, IconButton } from '../primitives';
import { Sheet } from '../sheet';
import type { TasksScreenProps } from './types';

/** The tasks on screen as Markdown text: read it, copy it, or share it. */
export function ExportSheet({
  p,
  title,
  tasks,
  onClose,
}: {
  p: TasksScreenProps;
  title: string;
  tasks: Task[];
  onClose: () => void;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const [copied, setCopied] = useState(false);
  const text = listText(title, tasks, p.today, i18n);
  return (
    <Sheet label={t('menu.export')} onClose={onClose}>
      <div className="sheet-head">
        <h2 className="sheet-heading">{t('menu.export')}</h2>
        <IconButton label={t('common.close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <textarea className="export-text" readOnly dir="auto" value={text} aria-label={title} />
      <div className="actions">
        <Button variant="primary" onClick={() => void p.onCopy(text).then(setCopied)}>
          {t('card.copy')}
        </Button>
        {p.onShare && (
          <Button onClick={() => void p.onShare?.(title, text)}>{t('card.share')}</Button>
        )}
      </div>
      <p className="hint" role="status">
        {copied ? t('card.copied') : ''}
      </p>
    </Sheet>
  );
}
