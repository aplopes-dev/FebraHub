'use client';



import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { ConfirmDialog } from '@citybox/ui/organisms';

import type { PatientBudgetAction } from '../budgets/patient-budget-actions-menu';

import { PatientBudgetSheet } from '../budgets/patient-budget-sheet';

import { PatientBudgetsTable } from '../budgets/patient-budgets-table';

import { PatientBudgetsToolbar } from '../budgets/patient-budgets-toolbar';

import {

  PATIENT_BUDGET_PAGE_SIZE_OPTIONS,

  type PatientBudgetPageSize,

} from '../budgets/patient-budgets-pagination-bar';

import {

  getPatientBudgetMutationErrorMessage,

  usePatientBudgetMutations,

  usePatientBudgetsQuery,

} from '../../../hooks/use-patient-budgets-queries';

import { useDebouncedSearch } from '../../../hooks/use-debounced-search';

import { getPatientBudgetById } from '../../../services/patient-budgets.service';

import {

  buildPatientBudgetPdf,

  buildPatientBudgetPdfFileName,

  mapClinicSettingsToBudgetPdfClinic,

} from '../../../lib/build-patient-budget-pdf';

import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';

import { PatientDocumentPdfSheet } from '../documents/patient-document-pdf-sheet';

import { PatientContractEmissionSheet } from '../documents/contracts/patient-contract-emission-sheet';
import { PatientContractPreviewSheet } from '../documents/contracts/patient-contract-preview-sheet';
import { getPatientContractEmissionById } from '../../../services/patient-contract-emissions.service';
import {
  buildContractorFieldsFromPatient,
  formatMissingContractVariableLabels,
  listMissingContractVariableFields,
} from '../../../lib/contract-variable-gaps';
import { usePatientDetail } from '../../../lib/patient-detail-context';
import { budgetKeys } from '../../../hooks/query-keys';
import { useQueryClient } from '@tanstack/react-query';
import type { PatientContractEmissionFormValues } from '../../../types/patient-contract-emission';
import type { PatientContractEmissionRecord } from '../../../types/patient-contract-emission';


import { useStore } from '@/lib/store-context';

import { usePatientBudgetPermissions } from '../../../hooks/use-patient-budget-permissions';

import {

  toApiBudgetSort,

  type PatientBudgetSort,

} from '../../../lib/sort-patient-budgets';

import type { PatientBudgetSheetSubmitPayload } from '../../../types/patient-budget-form';

import type { PatientBudget } from '../../../types/patient-budget';

import type { PatientBudgetListMeta } from '../../../types/patient-budget-api';



const DEFAULT_PAGE_SIZE: PatientBudgetPageSize = PATIENT_BUDGET_PAGE_SIZE_OPTIONS[1];



const DEFAULT_META: PatientBudgetListMeta = {

  total: 0,

  page: 1,

  perPage: DEFAULT_PAGE_SIZE,

  totalPages: 0,

};



type PatientBudgetsTabProps = {
  patientId: string;
  patientName: string;
};

export function PatientBudgetsTab({ patientId, patientName }: PatientBudgetsTabProps) {

  const { storeId } = useStore();

  const { canRead, canCreate, canUpdate, canDelete, canApprove } = usePatientBudgetPermissions();

  const patient = usePatientDetail();
  const queryClient = useQueryClient();
  const [contractEmissionOpen, setContractEmissionOpen] = useState(false);
  const [contractPreviewOpen, setContractPreviewOpen] = useState(false);
  const [contractBudgetId, setContractBudgetId] = useState<string | null>(null);
  const [contractInitialOverrides, setContractInitialOverrides] = useState<Partial<PatientContractEmissionFormValues> | null>(null);
  const [previewContract, setPreviewContract] = useState<PatientContractEmissionRecord | null>(null);
  const [editingContract, setEditingContract] = useState<PatientContractEmissionRecord | null>(null);

  const { search, debouncedSearch, handleSearchChange } = useDebouncedSearch();

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState<PatientBudgetPageSize>(DEFAULT_PAGE_SIZE);

  const [sort, setSort] = useState<PatientBudgetSort | null>(null);

  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);

  const [editingBudget, setEditingBudget] = useState<PatientBudget | null>(null);

  const [budgetToDelete, setBudgetToDelete] = useState<PatientBudget | null>(null);

  const [isLoadingBudgetDetail, setIsLoadingBudgetDetail] = useState(false);

  const [printPreview, setPrintPreview] = useState<{

    budget: PatientBudget;

    pdfBlob: Blob;

  } | null>(null);

  const apiSort = toApiBudgetSort(sort);



  const budgetsQuery = usePatientBudgetsQuery(patientId, {

    page,

    perPage: pageSize,

    search: debouncedSearch,

    ...apiSort,

  }, canRead);

  const { createMutation, updateMutation, deleteMutation, duplicateMutation, approveMutation, statusMutation } =

    usePatientBudgetMutations(patientId);



  const budgets = budgetsQuery.data?.items ?? [];

  const meta = budgetsQuery.data?.meta ?? DEFAULT_META;



  const emptyMessage = debouncedSearch.trim()

    ? 'Nenhum orçamento encontrado para a busca informada.'

    : 'Nenhum orçamento cadastrado para este paciente.';



  const isSaving =

    createMutation.isPending ||
    updateMutation.isPending ||
    approveMutation.isPending ||
    statusMutation.isPending;

  const isDeleting = deleteMutation.isPending;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handlePageSizeChange = useCallback((nextPageSize: PatientBudgetPageSize) => {

    setPageSize(nextPageSize);

    setPage(1);

  }, []);



  const handleSortChange = useCallback((nextSort: PatientBudgetSort) => {

    setSort(nextSort);

    setPage(1);

  }, []);



  const loadBudgetDetail = useCallback(

    async (budgetId: string) => {

      if (!storeId) {

        throw new Error('Loja não selecionada.');

      }



      return getPatientBudgetById(storeId, patientId, budgetId);

    },

    [patientId, storeId],

  );



  const handleNewBudget = () => {

    setEditingBudget(null);

    setBudgetSheetOpen(true);

  };



  const handleSaveBudget = useCallback(

    async (payload: PatientBudgetSheetSubmitPayload, budgetId?: string) => {

      const draftPayload: PatientBudgetSheetSubmitPayload = {

        ...payload,

        status: 'draft',

      };



      try {

        if (budgetId) {

          await updateMutation.mutateAsync({ budgetId, payload: draftPayload });

          const previousStatus = editingBudget?.status ?? 'draft';
          const nextStatus = payload.status;

          if (nextStatus !== previousStatus && (nextStatus === 'rejected' || nextStatus === 'draft')) {
            await statusMutation.mutateAsync({
              budgetId,
              status: nextStatus,
              rejection: nextStatus === 'rejected' ? payload.rejection : null,
            });
            toast.success(
              nextStatus === 'rejected'
                ? 'Orçamento reprovado.'
                : 'Orçamento reaberto.',
            );
          } else {
            toast.success('Orçamento atualizado com sucesso.');
          }

        } else {

          await createMutation.mutateAsync(draftPayload);

          toast.success('Orçamento salvo com sucesso.');

        }

      } catch (error) {

        toast.error(getPatientBudgetMutationErrorMessage(error));

        throw error;

      }

    },

    [createMutation, editingBudget?.status, statusMutation, updateMutation],

  );



  const openNewContractEmission = useCallback(
    async (budgetId: string) => {
      if (!storeId) return;

      const clinicProfile = await getClinicProfile(storeId).catch(() => null);
      const overrides: Partial<PatientContractEmissionFormValues> = {
        ...buildContractorFieldsFromPatient(patient),
        contractedName: clinicProfile?.clinicName ?? '',
        contractedDocument: clinicProfile?.cnpj ?? '',
        contractedCity: clinicProfile?.city ?? '',
        contractDate: new Date().toISOString().slice(0, 10),
      };

      const missing = listMissingContractVariableFields({
        contractorName: overrides.contractorName ?? '',
        contractorBirthDate: overrides.contractorBirthDate ?? '',
        contractorCpf: overrides.contractorCpf ?? '',
        contractorZip: overrides.contractorZip ?? '',
        contractorStreet: overrides.contractorStreet ?? '',
        contractorNeighborhood: overrides.contractorNeighborhood ?? '',
        contractorCity: overrides.contractorCity ?? '',
        contractorState: overrides.contractorState ?? '',
        contractedName: overrides.contractedName ?? '',
        contractedDocument: overrides.contractedDocument ?? '',
        contractedCity: overrides.contractedCity ?? '',
      });
      if (missing.length > 0) {
        toast.message('Complete os dados do contrato', {
          description: `Preencha: ${formatMissingContractVariableLabels(missing)}.`,
        });
      }

      setEditingContract(null);
      setContractBudgetId(budgetId);
      setContractInitialOverrides(overrides);
      setContractEmissionOpen(true);
    },
    [patient, storeId],
  );

  const handleApproveBudget = useCallback(

    async (payload: PatientBudgetSheetSubmitPayload, budgetId?: string) => {

      const draftPayload: PatientBudgetSheetSubmitPayload = {

        ...payload,

        status: 'draft',

      };



      try {

        let resolvedBudgetId = budgetId;



        if (resolvedBudgetId) {

          if (canUpdate) {
            await updateMutation.mutateAsync({ budgetId: resolvedBudgetId, payload: draftPayload });
          }

        } else {

          if (!canCreate) {
            toast.message('Sem permissão para cadastrar orçamentos.');
            return;
          }

          const created = await createMutation.mutateAsync(draftPayload);

          resolvedBudgetId = created.id;

        }



        await approveMutation.mutateAsync({
          budgetId: resolvedBudgetId,
          dueDate: payload.dueDate,
          installments: payload.installments,
        });

        toast.success('Orçamento aprovado com sucesso.');

        if (payload.emitContractOnApprove && resolvedBudgetId) {
          await openNewContractEmission(resolvedBudgetId);
        }

      } catch (error) {

        toast.error(getPatientBudgetMutationErrorMessage(error));

        throw error;

      }

    },

    [approveMutation, canCreate, canUpdate, createMutation, openNewContractEmission, updateMutation],

  );



  const handleBudgetAction = useCallback(

    async (budget: PatientBudget, action: PatientBudgetAction) => {

      switch (action) {

        case 'edit': {
          if (!canUpdate) {
            toast.message('Sem permissão para editar orçamentos.');
            return;
          }

          setIsLoadingBudgetDetail(true);

          try {

            const detail = await loadBudgetDetail(budget.id);

            setEditingBudget(detail);

            setBudgetSheetOpen(true);

          } catch (error) {

            toast.error(getPatientBudgetMutationErrorMessage(error));

          } finally {

            setIsLoadingBudgetDetail(false);

          }

          return;

        }

        case 'send-whatsapp':

          toast.info(`Envio por WhatsApp do orçamento "${budget.description}" ainda não está disponível.`);

          return;

        case 'send-email':

          toast.info(`Envio por e-mail do orçamento "${budget.description}" ainda não está disponível.`);

          return;

        case 'duplicate': {

          try {

            await duplicateMutation.mutateAsync({

              budgetId: budget.id,

              description: `${budget.description} (cópia)`,

            });

            toast.success('Orçamento duplicado.');

          } catch (error) {

            toast.error(getPatientBudgetMutationErrorMessage(error));

          }

          return;

        }

        case 'print': {

          if (!storeId) {

            toast.error('Loja não selecionada.');

            return;

          }



          setIsLoadingBudgetDetail(true);

          try {

            const [detail, clinicProfile] = await Promise.all([

              loadBudgetDetail(budget.id),

              getClinicProfile(storeId),

            ]);

            const pdfBlob = await buildPatientBudgetPdf({

              budget: detail,

              patientName,

              clinic: mapClinicSettingsToBudgetPdfClinic(clinicProfile),

            });

            setPrintPreview({ budget: detail, pdfBlob });

          } catch (error) {

            toast.error(getPatientBudgetMutationErrorMessage(error));

          } finally {

            setIsLoadingBudgetDetail(false);

          }

          return;

        }

        case 'delete':
          if (!canDelete) {
            toast.message('Sem permissão para excluir orçamentos.');
            return;
          }

          setBudgetToDelete(budget);

          return;

        default:

          return;

      }

    },

    [canDelete, canUpdate, duplicateMutation, loadBudgetDetail, patientName, storeId],

  );



  const handleConfirmDelete = useCallback(async () => {

    if (!budgetToDelete) return;



    try {

      await deleteMutation.mutateAsync(budgetToDelete.id);

      toast.success('Orçamento excluído.');

      setBudgetToDelete(null);

    } catch (error) {

      toast.error(getPatientBudgetMutationErrorMessage(error));

    }

  }, [budgetToDelete, deleteMutation]);



  
  const invalidateBudgets = useCallback(() => {
    if (!storeId) return;
    void queryClient.invalidateQueries({ queryKey: budgetKeys.all(storeId, patientId) });
  }, [patientId, queryClient, storeId]);

  const handleContractAction = useCallback(
    async (budget: PatientBudget) => {
      if (budget.status !== 'approved' || !storeId) return;

      if (budget.contractEmissionId) {
        try {
          const contract = await getPatientContractEmissionById(
            storeId,
            patientId,
            budget.contractEmissionId,
          );
          setEditingContract(null);
          setPreviewContract(contract);
          setContractPreviewOpen(true);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Não foi possível abrir o contrato.',
          );
        }
        return;
      }

      await openNewContractEmission(budget.id);
    },
    [openNewContractEmission, patientId, storeId],
  );

  const handleSheetOpenChange = (open: boolean) => {

    setBudgetSheetOpen(open);

    if (!open) {

      setEditingBudget(null);

    }

  };



  if (budgetsQuery.isLoading && budgets.length === 0) {

    return <p className="text-sm text-muted-foreground">Carregando orçamentos…</p>;

  }



  if (budgetsQuery.isError) {

    return (

      <p className="text-sm text-destructive">

        Não foi possível carregar os orçamentos. Tente novamente.

      </p>

    );

  }



  return (

    <>

      <PatientBudgetsTable

        budgets={budgets}

        meta={meta}

        page={page}

        pageSize={pageSize}

        sort={sort}

        emptyMessage={emptyMessage}

        header={

          <PatientBudgetsToolbar

            search={search}

            onSearchChange={handleSearchChange}

            onNewBudget={handleNewBudget}

          />

        }

        onPageChange={setPage}

        onPageSizeChange={handlePageSizeChange}

        onSortChange={handleSortChange}

        onBudgetAction={handleBudgetAction}
        onContractAction={(budget) => void handleContractAction(budget)}

        onResolveBudgetDetail={loadBudgetDetail}

        isResolvingBudgetDetail={isLoadingBudgetDetail}

      />



      <PatientBudgetSheet

        open={budgetSheetOpen}

        canApproveBudget={canApprove}

        canSaveBudget={editingBudget ? canUpdate : canCreate}

        onOpenChange={handleSheetOpenChange}

        patientName={patientName}

        patientGender={patient.gender}

        editingBudget={editingBudget}

        isSaving={isSaving}

        onSave={handleSaveBudget}

        onApprove={handleApproveBudget}

      />



      <ConfirmDialog

        open={budgetToDelete !== null}

        onOpenChange={(open) => {

          if (!open && !isDeleting) {

            setBudgetToDelete(null);

          }

        }}

        title="Excluir orçamento"

        description={

          budgetToDelete

            ? `Tem certeza que deseja excluir o orçamento "${budgetToDelete.description}"? Esta ação não pode ser desfeita.`

            : ''

        }

        confirmLabel="Excluir"

        cancelLabel="Cancelar"

        confirmVariant="destructive"

        isConfirming={isDeleting}

        onConfirm={handleConfirmDelete}

      />



      <PatientDocumentPdfSheet

        open={printPreview !== null}

        onOpenChange={(open) => {

          if (!open) {

            setPrintPreview(null);

          }

        }}

        title={

          printPreview

            ? `Orçamento — ${printPreview.budget.description}`

            : 'Orçamento'

        }

        fileName={

          printPreview

            ? buildPatientBudgetPdfFileName(

                patientName,

                printPreview.budget.description,

                printPreview.budget.date,

              )

            : 'orcamento.pdf'

        }

        pdfBlob={printPreview?.pdfBlob ?? null}

      />

    
      <PatientContractEmissionSheet
        open={contractEmissionOpen}
        onOpenChange={(open) => {
          setContractEmissionOpen(open);
          if (!open) {
            setContractBudgetId(null);
            setContractInitialOverrides(null);
            setEditingContract(null);
          }
        }}
        patientId={patientId}
        budgetId={contractBudgetId}
        editingContract={editingContract}
        initialOverrides={contractInitialOverrides}
        onSaved={(contract) => {
          invalidateBudgets();
          setPreviewContract(contract);
          setContractPreviewOpen(true);
        }}
      />

      <PatientContractPreviewSheet
        open={contractPreviewOpen}
        onOpenChange={setContractPreviewOpen}
        patientId={patientId}
        contract={previewContract}
        onEdit={(contract) => {
          setContractPreviewOpen(false);
          setEditingContract(contract);
          setContractBudgetId(contract.budgetId ?? null);
          setContractInitialOverrides(null);
          setContractEmissionOpen(true);
        }}
        onDeleted={() => {
          setPreviewContract(null);
          invalidateBudgets();
        }}
        onContractUpdated={setPreviewContract}
      />

    </>

  );

}


