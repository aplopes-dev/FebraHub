'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@citybox/ui';
import { Button, Label } from '@citybox/ui/atoms';
import { ClinicCompactSwitch } from '@/features/clinic/components/clinic-compact-switch';
import {
  filterBudgetTreatmentsForDisplay,
  paginateTreatments,
} from '../../../lib/filter-patient-treatments';
import type { PatientTreatment } from '../../../types/patient-treatment';
import type { PatientTreatmentAction } from './patient-treatment-actions-menu';
import { PatientTreatmentsSortableList } from './patient-treatments-sortable-list';
import {
  PATIENT_TREATMENT_PAGE_SIZE_OPTIONS,
  PatientTreatmentsPaginationBar,
  type PatientTreatmentPageSize,
} from './patient-treatments-pagination-bar';

type PatientBudgetTreatmentsPanelProps = {
  treatments: PatientTreatment[];
  disabled?: boolean;
  className?: string;
  primaryActionLabel?: string;
  /** Tratamentos com atendimento já registrado (nutrição: inicializados). */
  concludedTreatmentIds?: ReadonlySet<string>;
  /** Multi-select + Finalizar N (desligado na nutrição / Inicializar). */
  selectionEnabled?: boolean;
  onFinalize: (treatment: PatientTreatment) => void;
  onFinalizeSelected?: (treatments: PatientTreatment[]) => void;
  onTreatmentAction: (treatment: PatientTreatment, action: PatientTreatmentAction) => void;
  onReorder: (reorderedTreatments: PatientTreatment[]) => void;
};

export function PatientBudgetTreatmentsPanel({
  treatments,
  disabled = false,
  className,
  primaryActionLabel,
  concludedTreatmentIds,
  selectionEnabled = false,
  onFinalize,
  onFinalizeSelected,
  onTreatmentAction,
  onReorder,
}: PatientBudgetTreatmentsPanelProps) {
  const [showFinalized, setShowFinalized] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PatientTreatmentPageSize>(
    PATIENT_TREATMENT_PAGE_SIZE_OPTIONS[0],
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const filteredTreatments = useMemo(
    () =>
      filterBudgetTreatmentsForDisplay(
        treatments,
        showFinalized,
        concludedTreatmentIds,
      ),
    [concludedTreatmentIds, showFinalized, treatments],
  );

  const pagination = useMemo(
    () => paginateTreatments(filteredTreatments, page, pageSize),
    [filteredTreatments, page, pageSize],
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  useEffect(() => {
    if (!selectionEnabled) {
      setSelectedIds(new Set());
      return;
    }

    const selectableIds = new Set(
      treatments
        .filter(
          (treatment) =>
            treatment.status !== 'finalized' &&
            !concludedTreatmentIds?.has(treatment.id),
        )
        .map((treatment) => treatment.id),
    );

    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => selectableIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [concludedTreatmentIds, selectionEnabled, treatments]);

  const selectedTreatments = useMemo(
    () => treatments.filter((treatment) => selectedIds.has(treatment.id)),
    [selectedIds, treatments],
  );

  const handleShowFinalizedChange = (checked: boolean) => {
    setShowFinalized(checked);
    setPage(1);
  };

  const handlePageSizeChange = (nextPageSize: PatientTreatmentPageSize) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  const handleSelectedChange = (treatment: PatientTreatment, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(treatment.id);
      } else {
        next.delete(treatment.id);
      }
      return next;
    });
  };

  const handleFinalizeSelected = () => {
    if (selectedTreatments.length === 0 || !onFinalizeSelected) {
      return;
    }
    onFinalizeSelected(selectedTreatments);
  };

  return (
    <div className={cn('space-y-4 rounded-2xl border border-border/50 bg-card p-4 md:p-6', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-foreground">Procedimentos</h3>
        <div className="flex flex-wrap items-center gap-2">
          {selectionEnabled && selectedTreatments.length > 0 ? (
            <Button
              type="button"
              size="sm"
              disabled={disabled}
              onClick={handleFinalizeSelected}
            >
              {selectedTreatments.length === 1
                ? 'Finalizar 1 procedimento'
                : `Finalizar ${selectedTreatments.length} procedimentos`}
            </Button>
          ) : null}
          <div className="flex items-center gap-2">
            <ClinicCompactSwitch
              id="patient-treatments-show-finalized"
              checked={showFinalized}
              disabled={disabled}
              onCheckedChange={(checked) => handleShowFinalizedChange(checked === true)}
            />
            <Label htmlFor="patient-treatments-show-finalized" className="text-sm font-normal">
              Mostrar finalizados
            </Label>
          </div>
        </div>
      </div>

      <PatientTreatmentsSortableList
        treatments={pagination.items}
        disabled={disabled}
        dragDisabled={showFinalized || pagination.totalPages > 1}
        emptyMessage={
          showFinalized
            ? 'Nenhum procedimento finalizado.'
            : 'Nenhum procedimento ativo.'
        }
        primaryActionLabel={primaryActionLabel}
        concludedTreatmentIds={concludedTreatmentIds}
        showFinalizedList={showFinalized}
        selectionEnabled={selectionEnabled}
        selectedIds={selectedIds}
        onSelectedChange={handleSelectedChange}
        onFinalize={onFinalize}
        onTreatmentAction={onTreatmentAction}
        onReorder={onReorder}
      />

      <PatientTreatmentsPaginationBar
        page={page}
        pageSize={pageSize}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
