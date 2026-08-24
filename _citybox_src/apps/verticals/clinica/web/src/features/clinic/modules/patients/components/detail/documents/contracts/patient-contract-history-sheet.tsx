'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@citybox/ui';
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@citybox/ui/atoms';
import { ConfirmDialog } from '@citybox/ui/organisms';
import {
  CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
  CLINIC_NARROW_SHEET_CONTENT_CLASS,
  CLINIC_SHEET_BODY_PADDING_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_HEADER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { useStore } from '@/lib/store-context';
import {
  usePatientContractEmissionMutations,
  usePatientContractEmissionsQuery,
} from '../../../../hooks/use-patient-documents-queries';
import { getPatientContractEmissionById } from '../../../../services/patient-contract-emissions.service';
import { printPatientContractDocument } from '../../../../lib/print-patient-contract';
import type { PatientContractEmissionRecord } from '../../../../types/patient-contract-emission';
import {
  DEFAULT_PATIENT_DOCUMENTS_LIST_META,
  PATIENT_DOCUMENTS_HISTORY_PAGE_SIZE,
  PatientDocumentsHistoryToolbar,
} from '../patient-documents-history-toolbar';
import { PatientContractHistoryCard } from './patient-contract-history-card';

type PatientContractHistorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  onView: (contract: PatientContractEmissionRecord) => void;
  onEdit: (contract: PatientContractEmissionRecord) => void;
};

export function PatientContractHistorySheet({
  open,
  onOpenChange,
  patientId,
  onView,
  onEdit,
}: PatientContractHistorySheetProps) {
  const { storeId } = useStore();
  const [page, setPage] = useState(1);
  const [contractToDelete, setContractToDelete] = useState<PatientContractEmissionRecord | null>(
    null,
  );
  const [isPrintingId, setIsPrintingId] = useState<string | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      perPage: PATIENT_DOCUMENTS_HISTORY_PAGE_SIZE,
      sortBy: 'issuedAt' as const,
      sortOrder: 'desc' as const,
    }),
    [page],
  );

  const { data, isLoading, isFetching } = usePatientContractEmissionsQuery(
    patientId,
    listParams,
    open,
  );
  const { deleteMutation } = usePatientContractEmissionMutations(patientId);

  const contracts = data?.items ?? [];
  const meta = data?.meta ?? DEFAULT_PATIENT_DOCUMENTS_LIST_META;

  useEffect(() => {
    if (!open) {
      setPage(1);
    }
  }, [open]);

  const handlePrint = async (contract: PatientContractEmissionRecord) => {
    if (!storeId) return;

    setIsPrintingId(contract.id);
    try {
      const detail = contract.content
        ? contract
        : await getPatientContractEmissionById(storeId, patientId, contract.id);
      await printPatientContractDocument({
        storeId,
        patientId,
        contract: detail,
      });
    } catch {
      toast.error('Não foi possível carregar o contrato para impressão.');
    } finally {
      setIsPrintingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!contractToDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(contractToDelete.id);
      toast.success('Contrato excluído.');
      setContractToDelete(null);
    } catch {
      toast.error('Não foi possível excluir o contrato.');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={cn(CLINIC_FLOATING_SHEET_LAYOUT_CLASS, CLINIC_NARROW_SHEET_CONTENT_CLASS)}
        >
          <SheetHeader className={CLINIC_SHEET_HEADER_CLASS}>
            <SheetTitle>Histórico de contratos</SheetTitle>
          </SheetHeader>

          <div className={cn(CLINIC_SHEET_SCROLL_BODY_CLASS, CLINIC_SHEET_BODY_PADDING_CLASS)}>
            <PatientDocumentsHistoryToolbar
              hideSearch
              meta={meta}
              onPageChange={setPage}
            />

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando contratos…
              </div>
            ) : contracts.length > 0 ? (
              <div className={cn('mt-4 space-y-4', isFetching ? 'opacity-60' : undefined)}>
                {contracts.map((contract) => (
                  <PatientContractHistoryCard
                    key={contract.id}
                    contract={contract}
                    onView={onView}
                    onEdit={onEdit}
                    onPrint={handlePrint}
                    onDelete={setContractToDelete}
                    isPrinting={isPrintingId === contract.id}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Nenhum contrato salvo ainda.</p>
            )}
          </div>

          <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
            <Button
              type="button"
              variant="outline"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={contractToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deleteMutation.isPending) {
            setContractToDelete(null);
          }
        }}
        title="Excluir contrato"
        description={
          contractToDelete
            ? `Tem certeza que deseja excluir o contrato "${contractToDelete.templateName}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  );
}
