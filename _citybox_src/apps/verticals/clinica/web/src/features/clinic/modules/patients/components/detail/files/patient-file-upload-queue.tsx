'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, X, XCircle } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button } from '@citybox/ui/atoms';
import { formatFileSize } from '../../../lib/format-file-size';
import type { PatientFileUploadTask } from '../../../types/patient-file';

type PatientFileUploadQueueProps = {
  tasks: PatientFileUploadTask[];
  onDismiss: () => void;
};

function buildUploadSummary(tasks: readonly PatientFileUploadTask[]): string {
  const uploading = tasks.filter((task) => task.status === 'uploading').length;
  const success = tasks.filter((task) => task.status === 'success').length;
  const errors = tasks.filter((task) => task.status === 'error').length;

  if (uploading > 0 && success === 0 && errors === 0) {
    return uploading === 1 ? 'Enviando 1 arquivo...' : `Enviando ${uploading} arquivos...`;
  }

  if (success > 0 && uploading === 0 && errors === 0) {
    return success === 1 ? '1 envio concluído' : `${success} envios concluídos`;
  }

  const parts: string[] = [];
  if (success > 0) {
    parts.push(success === 1 ? '1 concluído' : `${success} concluídos`);
  }
  if (uploading > 0) {
    parts.push(uploading === 1 ? '1 enviando' : `${uploading} enviando`);
  }
  if (errors > 0) {
    parts.push(errors === 1 ? '1 com erro' : `${errors} com erro`);
  }

  return parts.join(' · ');
}

function UploadStatusIndicator({ task }: { task: PatientFileUploadTask }) {
  if (task.status === 'success') {
    return (
      <CheckCircle2
        className="size-10 shrink-0 text-emerald-600"
        aria-label={`Upload de ${task.fileName} concluído`}
      />
    );
  }

  if (task.status === 'error') {
    return (
      <XCircle
        className="size-10 shrink-0 text-destructive"
        aria-label={`Erro ao enviar ${task.fileName}`}
      />
    );
  }

  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/25 bg-background"
      aria-label={`Enviando ${task.fileName}: ${task.progress}%`}
      role="progressbar"
      aria-valuenow={task.progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className="text-xs font-semibold text-foreground">{task.progress}%</span>
    </div>
  );
}

export function PatientFileUploadQueue({ tasks, onDismiss }: PatientFileUploadQueueProps) {
  const [expanded, setExpanded] = useState(true);

  if (tasks.length === 0) return null;

  const summary = buildUploadSummary(tasks);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 w-[384px] -translate-x-1/2 overflow-hidden rounded-xl border border-border/60 shadow-lg"
      role="region"
      aria-label="Progresso de envio de arquivos"
    >
      <div className="flex h-[48.67px] items-center justify-between gap-3 bg-muted/80 px-4">
        <p className="truncate text-sm font-medium text-foreground">{summary}</p>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label={expanded ? 'Recolher envios' : 'Expandir envios'}
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            <ChevronDown
              className={cn('size-4 transition-transform', !expanded && 'rotate-180')}
              aria-hidden
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Fechar painel de envios"
            onClick={onDismiss}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      {expanded
        ? tasks.map((task) => (
            <div
              key={task.id}
              className="flex h-[88px] items-center gap-3 border-t border-border/50 bg-background px-4"
            >
              <UploadStatusIndicator task={task} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{task.fileName}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(task.sizeBytes)}</p>
                {task.status === 'error' && task.errorMessage ? (
                  <p className="mt-0.5 truncate text-xs text-destructive">{task.errorMessage}</p>
                ) : null}
              </div>
            </div>
          ))
        : null}
    </div>
  );
}
