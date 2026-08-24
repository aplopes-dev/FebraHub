'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@citybox/ui/atoms';
import {
  RichTextEditor,
  type EditorVariable,
  type RichTextEditorHandle,
} from '@citybox/ui/organisms';
import {
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import {
  editorHtmlToWhatsappBody,
  whatsappBodyToEditorHtml,
} from '../lib/whatsapp-template-editor-html';
import {
  WHATSAPP_TEMPLATE_LABELS,
  WHATSAPP_VARIABLE_DRAG_MIME,
  type WhatsappTemplateItem,
  type WhatsappTemplateKey,
} from '../types/whatsapp';
import { WhatsappVariablesSidebar } from './whatsapp-variables-sidebar';

type WhatsappTemplateSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: WhatsappTemplateItem | null;
  isSaving?: boolean;
  onSave?: (item: { key: WhatsappTemplateKey; body: string }) => Promise<void>;
};

export function WhatsappTemplateSheet({
  open,
  onOpenChange,
  editingTemplate,
  isSaving = false,
  onSave,
}: WhatsappTemplateSheetProps) {
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [contentHtml, setContentHtml] = useState('');

  useEffect(() => {
    if (!open) {
      setContentHtml('');
      return;
    }
    if (editingTemplate) {
      setContentHtml(whatsappBodyToEditorHtml(editingTemplate.body));
    }
  }, [editingTemplate, open]);

  const parseVariableDrop = useCallback(
    (dataTransfer: DataTransfer): EditorVariable | null => {
      const token = dataTransfer.getData(WHATSAPP_VARIABLE_DRAG_MIME);
      if (!token) return null;
      const label = dataTransfer.getData('text/plain') || token;
      return { token, label };
    },
    [],
  );

  const handleSheetOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isSaving) return;
      onOpenChange(nextOpen);
    },
    [isSaving, onOpenChange],
  );

  const handleClose = () => {
    if (isSaving) return;
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      await onSave?.({
        key: editingTemplate.key,
        body: editorHtmlToWhatsappBody(contentHtml),
      });
      onOpenChange(false);
    } catch {
      // Erros exibidos via toast na mutation.
    }
  };

  const title = editingTemplate
    ? WHATSAPP_TEMPLATE_LABELS[editingTemplate.key]
    : 'Template WhatsApp';

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        {...CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS}
        className={cn(
          'flex flex-col gap-0 p-0',
          CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{`Editar ${title}`}</SheetTitle>
        </SheetHeader>

        <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
          {isSaving ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Salvando template…
              </div>
            </div>
          ) : null}

          <WhatsappVariablesSidebar
            className="max-lg:max-h-56"
            onSelectVariable={(variable) =>
              editorRef.current?.insertVariable({
                token: variable.token,
                label: variable.label,
              })
            }
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="border-b border-border/50 px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Edite a mensagem e insira variáveis pelos chips à esquerda.
              </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-6">
              <RichTextEditor
                ref={editorRef}
                value={contentHtml}
                onChange={setContentHtml}
                placeholder="Digite a mensagem ou arraste variáveis da barra lateral…"
                ariaLabel="Conteúdo do template WhatsApp"
                page="fluid"
                disabled={isSaving}
                dropMimeType={WHATSAPP_VARIABLE_DRAG_MIME}
                parseDropData={parseVariableDrop}
                className="min-h-0 flex-1"
              />
            </div>
          </div>
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="ghost"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={() => void handleSave()}
            disabled={isSaving || !editingTemplate}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
