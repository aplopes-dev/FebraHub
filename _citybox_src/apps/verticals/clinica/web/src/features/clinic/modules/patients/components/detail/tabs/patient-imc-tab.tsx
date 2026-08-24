'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@citybox/ui/atoms';
import {
  getPatientBodyMetricMutationErrorMessage,
  usePatientBodyMetricMutations,
  usePatientBodyMetricsQuery,
} from '../../../hooks/use-patient-body-metrics-queries';
import type { ClinicPatient } from '../../../types/clinic-patient';
import { PatientBodyMetricSheet } from '../about/patient-body-metric-sheet';
import { PatientBodyMetricsTable } from '../imc/patient-body-metrics-table';
import {
  PATIENT_BODY_METRIC_PAGE_SIZE_OPTIONS,
  type PatientBodyMetricPageSize,
} from '../imc/patient-body-metrics-pagination-bar';
import { PatientImcLatestSummary } from '../imc/patient-imc-latest-summary';

type PatientImcTabProps = {
  patient: ClinicPatient;
};

const DEFAULT_PAGE_SIZE: PatientBodyMetricPageSize = PATIENT_BODY_METRIC_PAGE_SIZE_OPTIONS[1];

const DEFAULT_META = {
  total: 0,
  page: 1,
  perPage: DEFAULT_PAGE_SIZE,
  totalPages: 0,
};

export function PatientImcTab({ patient }: PatientImcTabProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PatientBodyMetricPageSize>(DEFAULT_PAGE_SIZE);
  const [sheetOpen, setSheetOpen] = useState(false);

  const listParams = useMemo(
    () => ({ page, perPage: pageSize }),
    [page, pageSize],
  );

  const { data: listData, isLoading, isError } = usePatientBodyMetricsQuery(
    patient.id,
    listParams,
  );
  const latestQuery = usePatientBodyMetricsQuery(patient.id, { page: 1, perPage: 1 });
  const { createMutation } = usePatientBodyMetricMutations(patient.id);

  const metrics = listData?.items ?? [];
  const meta = listData?.meta ?? DEFAULT_META;
  const latest = latestQuery.data?.items[0];

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Cálculo de IMC</h1>
          <p className="text-sm text-muted-foreground">
            Registre peso e altura e acompanhe a evolução do índice de massa corporal.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setSheetOpen(true)}>
          <Plus className="size-3.5" aria-hidden />
          Nova medição
        </Button>
      </div>

      {isLoading && page === 1 ? (
        <p className="text-sm text-muted-foreground">Carregando medições…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar as medições.</p>
      ) : (
        <>
          <PatientImcLatestSummary patient={patient} latest={latest} />

          <PatientBodyMetricsTable
            metrics={metrics}
            meta={meta}
            page={page}
            pageSize={pageSize}
            emptyMessage="Nenhuma medição registrada."
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            header={
              <h2 className="text-sm font-semibold text-foreground">
                Histórico de medições
              </h2>
            }
          />
        </>
      )}

      <PatientBodyMetricSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        patient={patient}
        isSaving={createMutation.isPending}
        onSave={async (body) => {
          try {
            await createMutation.mutateAsync(body);
            toast.success('Medição registrada.');
            setSheetOpen(false);
          } catch (error) {
            throw new Error(getPatientBodyMetricMutationErrorMessage(error));
          }
        }}
      />
    </div>
  );
}
