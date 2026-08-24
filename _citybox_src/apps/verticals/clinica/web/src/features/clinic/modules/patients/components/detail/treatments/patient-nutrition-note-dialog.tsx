'use client';

import { useEffect, useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { Button, Label } from '@citybox/ui/atoms';
import { ModalForm, RichTextEditor } from '@citybox/ui/organisms';
import type { PatientNutritionNote } from '../../../types/patient-nutrition-note';

type PatientNutritionNoteDialogProps = {
  open: boolean;
  /** Nota em edição; nulo abre o formulário em branco. */
  note: PatientNutritionNote | null;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: { content: string; file: File | null }) => Promise<void>;
};

export function PatientNutritionNoteDialog({
  open,
  note,
  isSaving = false,
  onOpenChange,
  onSave,
}: PatientNutritionNoteDialogProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setContent(note?.content ?? '');
    setFile(null);
  }, [open, note]);

  const currentAttachmentName = file?.name ?? note?.attachment?.name ?? null;

  const clearSelectedFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={note ? 'Editar nota' : 'Adicionar nota'}
      saveLabel="Salvar"
      isSaving={isSaving}
      saveDisabled={!content.trim()}
      onSave={() => {
        void onSave({ content, file });
      }}
      contentClassName="sm:max-w-3xl"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Nota</Label>
          <RichTextEditor
            value={content}
            toolbar="basic"
            disabled={isSaving}
            ariaLabel="Conteúdo da nota"
            placeholder="Escreva a nota do atendimento..."
            className="min-h-[22rem]"
            onChange={setContent}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Anexo</Label>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="mr-2 size-4" aria-hidden />
              {currentAttachmentName ? 'Trocar arquivo' : 'Anexar arquivo'}
            </Button>
            {currentAttachmentName ? (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                {currentAttachmentName}
                {file ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remover arquivo selecionado"
                    onClick={clearSelectedFile}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                ) : null}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </ModalForm>
  );
}
