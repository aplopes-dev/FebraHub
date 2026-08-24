'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Input,
  Label,
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
import { ClinicCompactSwitch } from '@/features/clinic/components/clinic-compact-switch';
import {
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { useClinicContractForm } from '../lib/use-clinic-contract-form';
import { resolveConflictingDefaultContract } from '../lib/resolve-conflicting-default-contract';
import { CONTRACT_VARIABLE_DRAG_MIME } from '../types/clinic-contract';
import type { ClinicContractTemplate } from '../types/clinic-contract';
import type { ClinicContractSheetSuccessPayload } from '../types/clinic-contract-form';
import { ContractDefaultConfirmDialog } from './contract-default-confirm-dialog';
import { ContractVariablesSidebar } from './contract-variables-sidebar';

type ClinicContractSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate?: ClinicContractTemplate | null;
  templates?: ClinicContractTemplate[];
  isSaving?: boolean;
  onSave?: (payload: ClinicContractSheetSuccessPayload) => Promise<void>;
};

export function ClinicContractSheet({
  open,
  onOpenChange,
  editingTemplate = null,
  templates = [],
  isSaving = false,
  onSave,
}: ClinicContractSheetProps) {
  const { values, errors, patch, reset, initializeFromTemplate, submit } =
    useClinicContractForm();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const ignoreSheetDismissUntilRef = useRef(0);
  const [defaultConfirmOpen, setDefaultConfirmOpen] = useState(false);

  const conflictingDefault = resolveConflictingDefaultContract(
    templates,
    editingTemplate?.id,
  );

  useEffect(() => {
    if (!open) {
      reset();
      setDefaultConfirmOpen(false);
      return;
    }

    if (editingTemplate) {
      initializeFromTemplate(editingTemplate);
    } else {
      reset();
    }
  }, [editingTemplate, initializeFromTemplate, open, reset]);

  const armSheetDismissGuard = useCallback(() => {
    ignoreSheetDismissUntilRef.current = Date.now() + 400;
  }, []);

  const shouldIgnoreSheetDismiss = useCallback(() => {
    return defaultConfirmOpen || Date.now() < ignoreSheetDismissUntilRef.current;
  }, [defaultConfirmOpen]);

  const handleSheetOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && shouldIgnoreSheetDismiss()) {
        return;
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, shouldIgnoreSheetDismiss],
  );

  const handleDefaultToggle = useCallback(
    (checked: boolean) => {
      if (!checked) {
        patch({ isDefault: false });
        return;
      }

      if (conflictingDefault) {
        setDefaultConfirmOpen(true);
        return;
      }

      patch({ isDefault: true });
    },
    [conflictingDefault, patch],
  );

  const handleDefaultConfirmOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        armSheetDismissGuard();
      }
      setDefaultConfirmOpen(nextOpen);
    },
    [armSheetDismissGuard],
  );

  const handleConfirmDefaultReplacement = useCallback(() => {
    patch({ isDefault: true });
    armSheetDismissGuard();
    setDefaultConfirmOpen(false);
  }, [armSheetDismissGuard, patch]);

  const handleClose = () => {
    if (isSaving) return;
    onOpenChange(false);
  };

  const parseVariableDrop = useCallback(
    (dataTransfer: DataTransfer): EditorVariable | null => {
      const token = dataTransfer.getData(CONTRACT_VARIABLE_DRAG_MIME);
      if (!token) return null;

      const label = dataTransfer.getData('text/plain') || token;
      return { token, label };
    },
    [],
  );

  const handleSave = async () => {
    if (!submit()) return;

    try {
      await onSave?.({
        name: values.name,
        isDefault: values.isDefault,
        content: values.content,
        templateId: editingTemplate?.id,
      });
      onOpenChange(false);
    } catch {
      // Erros exibidos via toast no hook de mutations.
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        {...CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS}
        className={cn('flex flex-col gap-0 p-0', CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS)}
        onInteractOutside={(event) => {
          if (shouldIgnoreSheetDismiss()) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (shouldIgnoreSheetDismiss()) {
            event.preventDefault();
          }
        }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>
            {editingTemplate ? `Editar modelo: ${editingTemplate.name}` : 'Novo modelo de contrato'}
          </SheetTitle>
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
                Salvando modelo…
              </div>
            </div>
          ) : null}

          <ContractVariablesSidebar
            className="max-lg:max-h-56"
            onSelectVariable={(variable) =>
              editorRef.current?.insertVariable({
                token: variable.token,
                label: variable.label,
              })
            }
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex items-end gap-4 border-b border-border/50 px-6 py-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="clinic-contract-name">Nome do modelo</Label>
                <Input
                  id="clinic-contract-name"
                  value={values.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder="Ex.: Contrato de Prestação de Serviços"
                  disabled={isSaving}
                  aria-invalid={!!errors.name}
                  className="h-11 w-full border-border bg-input text-base font-medium"
                />
                {errors.name ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-3 self-end pb-0.5">
                <ClinicCompactSwitch
                  id="clinic-contract-default"
                  checked={values.isDefault}
                  disabled={isSaving}
                  onCheckedChange={(checked) => handleDefaultToggle(checked === true)}
                  aria-label="Modelo padrão"
                />
                <Label htmlFor="clinic-contract-default" className="text-sm font-medium">
                  Modelo padrão
                </Label>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-6">
              <RichTextEditor
                ref={editorRef}
                value={values.content}
                onChange={(html) => patch({ content: html })}
                placeholder="Digite o conteúdo do contrato ou arraste variáveis da barra lateral…"
                ariaLabel="Conteúdo do contrato"
                page="a4"
                disabled={isSaving}
                dropMimeType={CONTRACT_VARIABLE_DRAG_MIME}
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
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              'Salvar Modelo'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>

      {conflictingDefault ? (
        <ContractDefaultConfirmDialog
          open={defaultConfirmOpen}
          currentDefaultName={conflictingDefault.name}
          onOpenChange={handleDefaultConfirmOpenChange}
          onConfirm={handleConfirmDefaultReplacement}
        />
      ) : null}
    </Sheet>
  );
}
