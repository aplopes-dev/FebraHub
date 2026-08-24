'use client';

import { Loader2, Plus } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { ClinicPlanSheet } from '../components/clinic-plan-sheet';
import { ClinicPlansTable } from '../components/clinic-plans-table';
import { ResourceInUseDialog } from '../../components/resource-in-use-dialog';
import { useClinicPlansState } from '../lib/use-clinic-plans-state';

/** Aba "Planos" das Configurações — gestão de planos da clínica. */
export function PlanosSettingsContent() {
  const {
    plans,
    isLoading,
    loadError,
    retryLoad,
    planSheetOpen,
    editingPlan,
    isLoadingEdit,
    isSavingPlan,
    openNewPlan,
    openEditPlan,
    handleSheetOpenChange,
    savePlan,
    loadDefaultSpecialties,
    deletePlan,
    togglePlanStatus,
    inUseMessage,
    clearInUseMessage,
  } = useClinicPlansState();

  return (
    <>
      <div className="space-y-5 rounded-xl border border-border/60 bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground">Planos</h2>
            <p className="text-sm text-muted-foreground">Gerencie seus planos</p>
          </div>

          <Button type="button" onClick={openNewPlan} disabled={isLoading || isLoadingEdit}>
            <Plus className="mr-2 size-4" aria-hidden />
            Novo Plano
          </Button>
        </div>

        {loadError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p>Não foi possível carregar os planos.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void retryLoad()}>
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando planos…
          </div>
        ) : (
          <ClinicPlansTable
            plans={plans}
            onEdit={(plan) => void openEditPlan(plan)}
            onDelete={(plan) => void deletePlan(plan)}
            onToggleStatus={(plan, active) => void togglePlanStatus(plan, active)}
          />
        )}
      </div>

      <ClinicPlanSheet
        open={planSheetOpen}
        onOpenChange={handleSheetOpenChange}
        plans={plans}
        editingPlan={editingPlan}
        isSaving={isSavingPlan}
        isLoadingEdit={isLoadingEdit}
        onSave={savePlan}
        onLoadDefaultSpecialties={loadDefaultSpecialties}
      />

      <ResourceInUseDialog
        open={Boolean(inUseMessage)}
        onOpenChange={(open) => {
          if (!open) clearInUseMessage();
        }}
        description={inUseMessage ?? ''}
      />
    </>
  );
}
