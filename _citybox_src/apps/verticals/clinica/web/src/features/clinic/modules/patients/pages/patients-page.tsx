'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useStore } from '@/lib/store-context';
import { useCan, useAbility } from '@/features/clinic/permissions';
import { canAccessPatientFicha } from '@/features/clinic/lib/patient-list-access';
import { PatientEditSheet } from '../components/patient-edit-sheet';
import { PatientSheet } from '../components/patient-sheet';
import { PatientStatusDialog } from '../components/patient-status-dialog';
import { PatientsHeader } from '../components/patients-header';
import {
  PATIENTS_PAGE_SIZE_OPTIONS,
  type PatientsPageSize,
} from '../components/patients-pagination-bar';
import { PatientsTable, type PatientsTableSortState } from '../components/patients-table';
import { useDebouncedSearch } from '../hooks/use-debounced-search';
import {
  getPatientMutationErrorMessage,
  usePatientMutations,
} from '../hooks/use-patient-mutations';
import { usePatientsListQuery } from '../hooks/use-patients-list-query';
import { toApiSort } from '../lib/patient-api-mappers';
import type { PatientsTableSortColumn } from '../lib/patient-api-mappers';
import { getPatientStatusToggleMode } from '../lib/patient-status-toggle';
import type { ClinicPatient } from '../types/clinic-patient';
import type { PatientFormValues } from '../types/patient-form';
import { patientDetailDefaultHref } from '../lib/patient-detail-tabs';
import type { PatientListMeta } from '../types/patient-api';

const DEFAULT_META: PatientListMeta = {
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 0,
};

export function PatientsPage() {
  const router = useRouter();
  const { storeId } = useStore();
  const ability = useAbility();
  const canCreate = useCan('create', 'Patient');
  const canUpdate = useCan('update', 'Patient');
  const canToggleStatus = useCan('delete', 'Patient');
  const canOpenFicha = ability ? canAccessPatientFicha(ability) : false;
  const { search, debouncedSearch, handleSearchChange } = useDebouncedSearch();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PatientsPageSize>(PATIENTS_PAGE_SIZE_OPTIONS[1]);
  const [sort, setSort] = useState<PatientsTableSortState>({
    columnId: 'name',
    direction: 'asc',
  });
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<ClinicPatient | null>(null);
  const [patientToToggleStatus, setPatientToToggleStatus] = useState<ClinicPatient | null>(
    null,
  );

  const apiSort = sort ? toApiSort(sort.columnId, sort.direction) : {};

  const listQuery = usePatientsListQuery(storeId, {
    page,
    perPage,
    search: debouncedSearch,
    ...apiSort,
  });

  const { createMutation, updateMutation, updateStatusMutation } = usePatientMutations(storeId);

  const patients = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta ?? DEFAULT_META;

  const emptyMessage = debouncedSearch.trim()
    ? 'Nenhum paciente encontrado para a busca informada.'
    : 'Nenhum paciente cadastrado.';

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleNewPatient = useCallback(() => {
    setCreateSheetOpen(true);
  }, []);

  const handlePerPageChange = useCallback((nextPerPage: PatientsPageSize) => {
    setPerPage(nextPerPage);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((columnId: PatientsTableSortColumn) => {
    setSort((current) => {
      if (current?.columnId === columnId) {
        return {
          columnId,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { columnId, direction: 'asc' };
    });
    setPage(1);
  }, []);

  const handleSubmitPatient = useCallback(
    async (values: PatientFormValues) => {
      if (!storeId) {
        toast.error('Selecione uma loja para cadastrar o paciente.');
        throw new Error('MISSING_STORE');
      }

      try {
        await createMutation.mutateAsync(values);
        toast.success('Paciente cadastrado com sucesso.');
      } catch (error) {
        const { message } = getPatientMutationErrorMessage(error);
        toast.error(message);
        throw error;
      }
    },
    [createMutation, storeId],
  );

  const handleSubmitPatientEdit = useCallback(
    async (patientId: string, values: PatientFormValues) => {
      if (!storeId) {
        toast.error('Selecione uma loja para salvar o paciente.');
        throw new Error('MISSING_STORE');
      }

      try {
        await updateMutation.mutateAsync({ patientId, values });
        toast.success('Paciente atualizado com sucesso.');
      } catch (error) {
        const { message } = getPatientMutationErrorMessage(error);
        toast.error(message);
        throw error;
      }
    },
    [storeId, updateMutation],
  );

  const handlePatientClick = useCallback(
    (patient: ClinicPatient) => {
      if (!canOpenFicha) {
        toast.message('Sem permissão para consultar a ficha do paciente.');
        return;
      }
      router.push(patientDetailDefaultHref(patient.id));
    },
    [canOpenFicha, router],
  );

  const handleEdit = useCallback((patient: ClinicPatient) => {
    setEditingPatient(patient);
    setEditSheetOpen(true);
  }, []);

  const handleEditSheetOpenChange = useCallback((open: boolean) => {
    setEditSheetOpen(open);
    if (!open) {
      setEditingPatient(null);
    }
  }, []);

  const handleToggleStatus = useCallback((patient: ClinicPatient) => {
    setPatientToToggleStatus(patient);
  }, []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (!patientToToggleStatus || !storeId) return;

    const mode = getPatientStatusToggleMode(patientToToggleStatus.status);
    const nextStatus = mode === 'activate' ? 'active' : 'inactive';

    try {
      await updateStatusMutation.mutateAsync({
        patientId: patientToToggleStatus.id,
        status: nextStatus,
      });

      if (editingPatient?.id === patientToToggleStatus.id) {
        setEditSheetOpen(false);
        setEditingPatient(null);
      }

      toast.success(
        mode === 'activate'
          ? `${patientToToggleStatus.name} foi ativado.`
          : `${patientToToggleStatus.name} foi inativado.`,
      );
      setPatientToToggleStatus(null);
    } catch {
      toast.error(
        mode === 'activate'
          ? 'Não foi possível ativar o paciente.'
          : 'Não foi possível inativar o paciente.',
      );
    }
  }, [editingPatient?.id, patientToToggleStatus, storeId, updateStatusMutation]);

  return (
    <>
      <section className="space-y-6">
        <PatientsHeader
          search={search}
          onSearchChange={handleSearchChange}
          onNewPatient={handleNewPatient}
          canCreate={canCreate}
        />
        <PatientsTable
          patients={patients}
          meta={meta}
          page={page}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
          sort={sort}
          onSortChange={handleSortChange}
          emptyMessage={emptyMessage}
          onPatientClick={handlePatientClick}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          canEdit={canUpdate}
          canToggleStatus={canToggleStatus}
          canOpenFicha={canOpenFicha}
        />
      </section>

      <PatientSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        isSubmitting={createMutation.isPending}
        onSubmit={handleSubmitPatient}
      />

      <PatientEditSheet
        open={editSheetOpen}
        onOpenChange={handleEditSheetOpenChange}
        patient={editingPatient}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmitPatientEdit}
      />

      <PatientStatusDialog
        patient={patientToToggleStatus}
        open={patientToToggleStatus !== null}
        onOpenChange={(open) => {
          if (!open) setPatientToToggleStatus(null);
        }}
        isConfirming={updateStatusMutation.isPending}
        onConfirm={handleConfirmToggleStatus}
      />
    </>
  );
}
