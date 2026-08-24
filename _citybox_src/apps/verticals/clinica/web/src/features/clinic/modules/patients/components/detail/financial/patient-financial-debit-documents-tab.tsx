'use client';

import { useRef, type ChangeEvent } from 'react';
import { Download, Paperclip, X } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import type { PatientFinancialDebitSavedAttachment } from '../../../types/patient-financial-debit-form';

type PatientFinancialDebitDocumentsTabProps = {
  savedAttachments: PatientFinancialDebitSavedAttachment[];
  files: File[];
  disabled?: boolean;
  onFilesChange: (files: File[]) => void;
  onRemoveSavedAttachment?: (attachmentId: string) => void | Promise<void>;
  onDownloadSavedAttachment?: (attachment: PatientFinancialDebitSavedAttachment) => void;
};

export function PatientFinancialDebitDocumentsTab({
  savedAttachments,
  files,
  disabled = false,
  onFilesChange,
  onRemoveSavedAttachment,
  onDownloadSavedAttachment,
}: PatientFinancialDebitDocumentsTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAny = savedAttachments.length > 0 || files.length > 0;

  const handleSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) return;
    onFilesChange([...files, ...selected]);
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={handleSelectFiles}
      />

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="mr-2 size-4" aria-hidden />
        Anexar arquivos
      </Button>

      {hasAny ? (
        <ul className="space-y-2">
          {savedAttachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate text-foreground">{attachment.name}</span>
              <div className="flex shrink-0 items-center gap-1">
                {onDownloadSavedAttachment ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    aria-label={`Baixar ${attachment.name}`}
                    onClick={() => onDownloadSavedAttachment(attachment)}
                  >
                    <Download className="size-4" aria-hidden />
                  </Button>
                ) : null}
                {onRemoveSavedAttachment ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    aria-label={`Remover ${attachment.name}`}
                    onClick={() => void onRemoveSavedAttachment(attachment.id)}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate text-foreground">
                {file.name}
                <span className="ml-2 text-xs text-muted-foreground">(novo)</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label={`Remover ${file.name}`}
                onClick={() => handleRemoveFile(index)}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum arquivo anexado.</p>
      )}
    </div>
  );
}
