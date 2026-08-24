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
import {
  usePatientPrescriptionMutations,
  usePatientPrescriptionsQuery,
} from '../../../../hooks/use-patient-documents-queries';
import type { PatientPrescriptionRecord } from '../../../../types/patient-prescription';
import {
  DEFAULT_PATIENT_DOCUMENTS_LIST_META,
  PATIENT_DOCUMENTS_HISTORY_PAGE_SIZE,
  PatientDocumentsHistoryToolbar,
} from '../patient-documents-history-toolbar';
import { PatientPrescriptionHistoryCard } from './patient-prescription-history-card';

type PatientPrescriptionHistorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  onView: (prescription: PatientPrescriptionRecord) => void;
};

export function PatientPrescriptionHistorySheet({
  open,
  onOpenChange,
  patientId,
  onView,
}: PatientPrescriptionHistorySheetProps) {
  const [page, setPage] = useState(1);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<PatientPrescriptionRecord | null>(
    null,
  );

  const listParams = useMemo(
    () => ({
      page,
      perPage: PATIENT_DOCUMENTS_HISTORY_PAGE_SIZE,
      sortBy: 'issuedDate' as const,
      sortOrder: 'desc' as const,
    }),
    [page],
  );

  const { data, isLoading, isFetching } = usePatientPrescriptionsQuery(
    patientId,
    listParams,
    open,
  );
  const { deleteMutation } = usePatientPrescriptionMutations(patientId);

  const prescriptions = data?.items ?? [];
  const meta = data?.meta ?? DEFAULT_PATIENT_DOCUMENTS_LIST_META;

  useEffect(() => {
    if (!open) {
      setPage(1);
    }
  }, [open]);

  const handleConfirmDelete = async () => {
    if (!prescriptionToDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(prescriptionToDelete.id);
      toast.success('Receituário excluído.');
      setPrescriptionToDelete(null);
    } catch {
      toast.error('Não foi possível excluir o receituário.');
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
            <SheetTitle>Histórico de receituários</SheetTitle>
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
                Carregando receituários…
              </div>
            ) : prescriptions.length > 0 ? (
              <div className={cn('mt-4 space-y-4', isFetching ? 'opacity-60' : undefined)}>
                {prescriptions.map((prescription) => (
                  <PatientPrescriptionHistoryCard
                    key={prescription.id}
                    prescription={prescription}
                    onView={onView}
                    onDelete={setPrescriptionToDelete}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Nenhum receituário salvo ainda.</p>
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
        open={prescriptionToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deleteMutation.isPending) {
            setPrescriptionToDelete(null);
          }
        }}
        title="Excluir receituário"
        description={
          prescriptionToDelete
            ? `Tem certeza que deseja excluir o receituário emitido por "${prescriptionToDelete.professionalName}"? Esta ação não pode ser desfeita.`
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
