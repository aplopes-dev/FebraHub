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
  usePatientCertificateMutations,
  usePatientCertificatesQuery,
} from '../../../../hooks/use-patient-documents-queries';
import type { PatientCertificateRecord } from '../../../../types/patient-certificate';
import {
  DEFAULT_PATIENT_DOCUMENTS_LIST_META,
  PATIENT_DOCUMENTS_HISTORY_PAGE_SIZE,
  PatientDocumentsHistoryToolbar,
} from '../patient-documents-history-toolbar';
import { PatientCertificateHistoryCard } from './patient-certificate-history-card';

type PatientCertificateHistorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  onView: (certificate: PatientCertificateRecord) => void;
};

export function PatientCertificateHistorySheet({
  open,
  onOpenChange,
  patientId,
  onView,
}: PatientCertificateHistorySheetProps) {
  const [page, setPage] = useState(1);
  const [certificateToDelete, setCertificateToDelete] = useState<PatientCertificateRecord | null>(
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

  const { data, isLoading, isFetching } = usePatientCertificatesQuery(
    patientId,
    listParams,
    open,
  );
  const { deleteMutation } = usePatientCertificateMutations(patientId);

  const certificates = data?.items ?? [];
  const meta = data?.meta ?? DEFAULT_PATIENT_DOCUMENTS_LIST_META;

  useEffect(() => {
    if (!open) {
      setPage(1);
    }
  }, [open]);

  const handleConfirmDelete = async () => {
    if (!certificateToDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(certificateToDelete.id);
      toast.success('Atestado excluído.');
      setCertificateToDelete(null);
    } catch {
      toast.error('Não foi possível excluir o atestado.');
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
            <SheetTitle>Histórico de atestados</SheetTitle>
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
                Carregando atestados…
              </div>
            ) : certificates.length > 0 ? (
              <div className={cn('mt-4 space-y-4', isFetching ? 'opacity-60' : undefined)}>
                {certificates.map((certificate) => (
                  <PatientCertificateHistoryCard
                    key={certificate.id}
                    certificate={certificate}
                    onView={onView}
                    onDelete={setCertificateToDelete}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Nenhum atestado salvo ainda.</p>
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
        open={certificateToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deleteMutation.isPending) {
            setCertificateToDelete(null);
          }
        }}
        title="Excluir atestado"
        description={
          certificateToDelete
            ? `Tem certeza que deseja excluir o atestado emitido por "${certificateToDelete.professionalName}"? Esta ação não pode ser desfeita.`
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
