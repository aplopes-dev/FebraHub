'use client';

import { useCallback, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { ClinicContractSheet } from '../components/clinic-contract-sheet';
import { ClinicContractsTable } from '../components/clinic-contracts-table';
import { ResourceInUseDialog, isClinicaInUseConflict } from '../../components/resource-in-use-dialog';
import { useContractModels } from '../hooks/use-contract-models';
import type { ClinicContractTemplate } from '../types/clinic-contract';
import type { ClinicContractSheetSuccessPayload } from '../types/clinic-contract-form';
import { toast } from 'sonner';
import { ClinicaApiError } from '@/features/clinic/shared/api';

/** Aba "Contrato" das Configurações — gestão de modelos de contrato da clínica. */
export function ContractsSettingsContent() {
  const {
    templates,
    isLoading,
    isError,
    isSaving,
    isDeleting,
    saveTemplate,
    deleteTemplate,
  } = useContractModels();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ClinicContractTemplate | null>(null);
  const [inUseMessage, setInUseMessage] = useState<string | null>(null);

  const handleOpenNewTemplate = useCallback(() => {
    setEditingTemplate(null);
    setSheetOpen(true);
  }, []);

  const handleEditTemplate = useCallback((template: ClinicContractTemplate) => {
    setEditingTemplate(template);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingTemplate(null);
    }
  }, []);

  const handleSaveTemplate = useCallback(
    async (payload: ClinicContractSheetSuccessPayload) => {
      await saveTemplate(payload);
    },
    [saveTemplate],
  );

  const handleDeleteTemplate = useCallback(
    async (template: ClinicContractTemplate) => {
      try {
        await deleteTemplate(template.id);
      } catch (error) {
        if (isClinicaInUseConflict(error)) {
          setInUseMessage(error.message);
          return;
        }
        toast.error(
          error instanceof ClinicaApiError
            ? error.message
            : 'Não foi possível excluir o modelo de contrato.',
        );
      }
    },
    [deleteTemplate],
  );

  return (
    <>
      <div className="space-y-5 rounded-xl border border-border/60 bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground">Modelos de contratos</h2>
            <p className="text-sm text-muted-foreground">Gerencie seus modelos de contratos</p>
          </div>

          <Button type="button" onClick={handleOpenNewTemplate} disabled={isLoading}>
            <Plus className="mr-2 size-4" aria-hidden />
            Novo Modelo
          </Button>
        </div>

        {isLoading ? (
          <div
            className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando modelos…
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-destructive" role="alert">
            Não foi possível carregar os modelos de contrato.
          </p>
        ) : (
          <ClinicContractsTable
            templates={templates}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            isDeleting={isDeleting}
          />
        )}
      </div>

      <ClinicContractSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        editingTemplate={editingTemplate}
        templates={templates}
        isSaving={isSaving}
        onSave={handleSaveTemplate}
      />

      <ResourceInUseDialog
        open={Boolean(inUseMessage)}
        onOpenChange={(open) => {
          if (!open) setInUseMessage(null);
        }}
        description={inUseMessage ?? ''}
      />
    </>
  );
}
