'use client';

import { useEffect, useState, type RefObject } from 'react';
import { CircleAlert, Trash2, X } from 'lucide-react';
import {
  Button,
  Input,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Separator,
} from '@citybox/ui/atoms';
import { PATIENT_MODAL_FULL_BLEED_SEPARATOR_CLASS } from '../../../lib/patient-detail-tabs-ui';

const ANNOTATION_MAX_LENGTH = 255;

type LocationAnchor = {
  getBoundingClientRect: () => DOMRect;
};

export type PatientLocationAnnotationItem = {
  id: string;
  content: string;
  professionalName: string;
  createdAt: string;
};

type PatientLocationAnnotationsDialogProps = {
  /** Chave da localização (número do dente ou id da região). `null` fecha o popover. */
  locationKey: string | null;
  title: string;
  emptyMessage: string;
  anchorRef: RefObject<LocationAnchor | null>;
  annotations: readonly PatientLocationAnnotationItem[];
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAnnotation: (locationKey: string, content: string) => void | Promise<void>;
  onDeleteAnnotation: (
    locationKey: string,
    annotationId: string,
  ) => void | Promise<void>;
};

function formatAnnotationDate(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function PatientLocationAnnotationsDialog({
  locationKey,
  title,
  emptyMessage,
  anchorRef,
  annotations,
  isSubmitting = false,
  onOpenChange,
  onAddAnnotation,
  onDeleteAnnotation,
}: PatientLocationAnnotationsDialogProps) {
  const [draft, setDraft] = useState('');
  const open = locationKey !== null;

  useEffect(() => {
    setDraft('');
  }, [locationKey]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDraft('');
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (locationKey == null || isSubmitting) return;
    const content = draft.trim().slice(0, ANNOTATION_MAX_LENGTH);
    if (!content) return;
    try {
      await onAddAnnotation(locationKey, content);
      setDraft('');
    } catch {
      // Erro tratado pelo caller (toast).
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverAnchor
        virtualRef={anchorRef as RefObject<{ getBoundingClientRect: () => DOMRect }>}
      />
      <PopoverContent
        side="right"
        align="start"
        sideOffset={10}
        collisionPadding={12}
        className="flex max-h-[min(70dvh,32rem)] w-[min(32rem,calc(100vw-1.5rem))] flex-col gap-0 overflow-hidden p-0 pt-4 pb-4"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const input = (event.currentTarget as HTMLElement).querySelector('input');
          input?.focus();
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-3">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Fechar"
            onClick={() => handleOpenChange(false)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <Separator className={PATIENT_MODAL_FULL_BLEED_SEPARATOR_CLASS} />

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CircleAlert className="size-6 shrink-0 text-primary" aria-hidden />
              <Input
                value={draft}
                maxLength={ANNOTATION_MAX_LENGTH}
                onChange={(event) =>
                  setDraft(event.target.value.slice(0, ANNOTATION_MAX_LENGTH))
                }
                placeholder="Adicionar anotações..."
                className="border-transparent bg-input/50 hover:bg-input/60"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
                aria-label="Adicionar anotações"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center justify-between gap-2 pl-6">
              <span className="text-xs text-muted-foreground">
                {draft.length}/{ANNOTATION_MAX_LENGTH}
              </span>
              <Button
                type="button"
                size="sm"
                disabled={!draft.trim() || isSubmitting}
                onClick={() => {
                  void handleSubmit();
                }}
              >
                Adicionar
              </Button>
            </div>
          </div>

          {annotations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            <ul className="space-y-4">
              {annotations.map((annotation) => (
                <li
                  key={annotation.id}
                  className="space-y-2 rounded-xl border border-border/50 p-3"
                >
                  <div className="flex items-start gap-2">
                    <CircleAlert
                      className="mt-0.5 size-6 shrink-0 text-primary"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Por {annotation.professionalName} em{' '}
                        {formatAnnotationDate(annotation.createdAt)}
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {annotation.content}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir anotação"
                      disabled={isSubmitting}
                      onClick={() => {
                        if (locationKey != null) {
                          void onDeleteAnnotation(locationKey, annotation.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
