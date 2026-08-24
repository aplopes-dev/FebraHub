'use client';

import { useCallback, useState } from 'react';
import { AlertTriangle, Loader2, Plus } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { ClinicAnamnesisSheet } from '../components/clinic-anamnesis-sheet';
import { ClinicAnamnesesTable } from '../components/clinic-anamneses-table';
import { ResourceInUseDialog, isClinicaInUseConflict } from '../../components/resource-in-use-dialog';
import { useAnamnesisManagement } from '../hooks/use-anamnesis-management';
import {
  useAnamnesisQuestionsQuery,
  useAnamnesisTemplatesQuery,
} from '../hooks/use-anamnesis-queries';
import type { ClinicAnamnesisTemplate } from '../types/clinic-anamnesis';
import type { ClinicAnamnesisSheetSuccessPayload } from '../types/clinic-anamnesis-form';
import { toast } from 'sonner';
import { ClinicaApiError } from '@/features/clinic/shared/api';

/** Aba "Anamneses" das Configurações — gestão de modelos de anamnese da clínica. */
export function AnamnesesSettingsContent() {
  const {
    data: templates = [],
    isLoading,
    isError,
    refetch,
  } = useAnamnesisTemplatesQuery();
  const {
    data: questionLibrary = [],
    isFetching: isFetchingQuestions,
    refetch: refetchQuestions,
  } = useAnamnesisQuestionsQuery();
  const {
    saveTemplate,
    updateTemplateStatus,
    deleteTemplate,
    isSaving,
  } = useAnamnesisManagement();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ClinicAnamnesisTemplate | null>(null);
  const [inUseMessage, setInUseMessage] = useState<string | null>(null);

  const openTemplateSheet = useCallback(
    (template: ClinicAnamnesisTemplate | null) => {
      setEditingTemplate(template);
      setSheetOpen(true);
      void refetchQuestions();
    },
    [refetchQuestions],
  );

  const handleOpenNewTemplate = useCallback(() => {
    openTemplateSheet(null);
  }, [openTemplateSheet]);

  const handleEditTemplate = useCallback(
    (template: ClinicAnamnesisTemplate) => {
      openTemplateSheet(template);
    },
    [openTemplateSheet],
  );

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingTemplate(null);
    }
  }, []);

  const handleSaveTemplate = useCallback(
    async (payload: ClinicAnamnesisSheetSuccessPayload) => {
      await saveTemplate(payload);
    },
    [saveTemplate],
  );

  const handleDeleteTemplate = useCallback(
    async (template: ClinicAnamnesisTemplate) => {
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
            : 'Não foi possível excluir o modelo de anamnese.',
        );
      }
    },
    [deleteTemplate],
  );

  const handleToggleStatus = useCallback(
    (template: ClinicAnamnesisTemplate, active: boolean) => {
      void updateTemplateStatus({ template, active });
    },
    [updateTemplateStatus],
  );

  return (
    <>
      <div className="space-y-5 rounded-xl border border-border/60 bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground">Modelos de Anamnese</h2>
            <p className="text-sm text-muted-foreground">Gerencie seus modelos de anamnese</p>
          </div>

          <Button type="button" onClick={handleOpenNewTemplate} disabled={isLoading}>
            <Plus className="mr-2 size-4" aria-hidden />
            Novo modelo
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando modelos…
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 px-4 py-10 text-center">
            <AlertTriangle className="size-5 text-destructive" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os modelos de anamnese.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <ClinicAnamnesesTable
            templates={templates}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </div>

      <ClinicAnamnesisSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        editingTemplate={editingTemplate}
        questionLibrary={questionLibrary}
        isQuestionsLoading={isFetchingQuestions && questionLibrary.length === 0}
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
