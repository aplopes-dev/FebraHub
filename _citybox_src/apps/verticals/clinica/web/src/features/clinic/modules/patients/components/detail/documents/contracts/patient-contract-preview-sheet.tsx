'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSignature, Pencil, Printer, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_HEADER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { useStore } from '@/lib/store-context';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { usePatientContractEmissionMutations } from '../../../../hooks/use-patient-documents-queries';
import { contractEmissionKeys, budgetKeys } from '../../../../hooks/query-keys';
import { printPatientContractDocument } from '../../../../lib/print-patient-contract';
import { PATIENT_CONTRACT_PAPER_CSS } from '../../../../lib/patient-contract-paper-styles';
import { buildPatientContractPdf } from '../../../../lib/build-patient-contract-pdf';
import { blobToBase64 } from '../../../../lib/blob-to-base64';
import { usePatientDetail } from '../../../../lib/patient-detail-context';
import {
  getElectronicSignatureByTarget,
  requestContractSignature,
} from '../../../../services/electronic-signatures.service';
import { invalidateSignatureCredits } from '@/features/clinic/loja/lib/invalidate-signature-credits';
import {
  isSignatureCreditBalanceEmpty,
  isSignatureCreditsInsufficientError,
} from '@/features/clinic/loja/lib/signature-credits-insufficient';
import { SignatureCreditsInsufficientDialog } from '@/features/clinic/loja/components/signature-credits-insufficient-dialog';
import type { ElectronicSignature } from '../../../../types/electronic-signature';
import type {
  ContractSignatureStatus,
  PatientContractEmissionRecord,
} from '../../../../types/patient-contract-emission';
import { formatPatientContractPreviewIssuedLabel } from '../../../../lib/format-patient-contract-issued';
import { ContractSignatureBadge } from './contract-signature-badge';
import { ContractSignatoriesAccordion } from './contract-signatories-accordion';
import {
  PatientContractSignatureRequestSheet,
  type ContractSignatureRequestConfirm,
  type ContractSignatureResponsibleInput,
} from './patient-contract-signature-request-sheet';

type PatientContractPreviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  contract: PatientContractEmissionRecord | null;
  onEdit: (contract: PatientContractEmissionRecord) => void;
  onDeleted: () => void;
  /** Mantém o contrato do pai sincronizado após solicitar/cancelar assinatura. */
  onContractUpdated?: (contract: PatientContractEmissionRecord) => void;
};

export function PatientContractPreviewSheet({
  open,
  onOpenChange,
  patientId,
  contract,
  onEdit,
  onDeleted,
  onContractUpdated,
}: PatientContractPreviewSheetProps) {
  const patient = usePatientDetail();
  const { storeId } = useStore();
  const queryClient = useQueryClient();
  const { deleteMutation } = usePatientContractEmissionMutations(patientId);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [signatureRequesting, setSignatureRequesting] = useState(false);
  const [creditsInsufficientOpen, setCreditsInsufficientOpen] = useState(false);
  const [activeSignature, setActiveSignature] = useState<ElectronicSignature | null>(null);
  const [signatureLoading, setSignatureLoading] = useState(false);
  /** Status local enquanto o `contract` do pai ainda não refletiu a solicitação. */
  const [optimisticStatuses, setOptimisticStatuses] = useState<{
    patient: ContractSignatureStatus;
    responsible: ContractSignatureStatus;
  } | null>(null);
  const [defaultResponsible, setDefaultResponsible] = useState<ContractSignatureResponsibleInput>({
    name: '',
    email: '',
    phone: '',
  });
  const [clinicName, setClinicName] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  const patientSignatureStatus =
    optimisticStatuses?.patient ?? contract?.patientSignatureStatus ?? 'unsigned';
  const responsibleSignatureStatus =
    optimisticStatuses?.responsible ??
    contract?.responsibleSignatureStatus ??
    'unsigned';

  const canRequestSignature =
    patientSignatureStatus === 'unsigned' &&
    responsibleSignatureStatus === 'unsigned' &&
    !activeSignature;
  const hasPendingOrSigned =
    patientSignatureStatus === 'pending' ||
    responsibleSignatureStatus === 'pending' ||
    (patientSignatureStatus === 'signed' && responsibleSignatureStatus === 'signed') ||
    Boolean(activeSignature);

  const invalidateContracts = useCallback(async () => {
    if (!storeId) return;
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: contractEmissionKeys.all(storeId, patientId),
      }),
      queryClient.invalidateQueries({
        queryKey: budgetKeys.all(storeId, patientId),
      }),
    ]);
  }, [patientId, queryClient, storeId]);

  const loadSignature = useCallback(
    async (options?: { sync?: boolean }) => {
      if (!contract || !storeId) {
        setActiveSignature(null);
        setSignatureLoading(false);
        return;
      }
      if (
        patientSignatureStatus === 'unsigned' &&
        responsibleSignatureStatus === 'unsigned'
      ) {
        // Prop stale ou sem solicitação: não apagar activeSignature aqui
        // (poll/effect faziam o accordion sumir e o Editar voltar).
        setSignatureLoading(false);
        return;
      }
      try {
        const signature = await getElectronicSignatureByTarget(
          storeId,
          patientId,
          'contract',
          contract.id,
          { sync: options?.sync === true },
        );
        setActiveSignature(signature);
        const contractAlreadySynced =
          patientSignatureStatus === 'signed' &&
          responsibleSignatureStatus === 'signed';
        if (
          !contractAlreadySynced &&
          (signature.status === 'signed' ||
            signature.signers.every((signer) => signer.status === 'signed'))
        ) {
          setOptimisticStatuses({ patient: 'signed', responsible: 'signed' });
          onContractUpdated?.({
            ...contract,
            patientSignatureStatus: 'signed',
            responsibleSignatureStatus: 'signed',
          });
          void invalidateContracts();
        }
      } catch {
        // Mantém o estado atual se a sync falhar.
      } finally {
        setSignatureLoading(false);
      }
    },
    [
      contract,
      invalidateContracts,
      onContractUpdated,
      patientId,
      patientSignatureStatus,
      responsibleSignatureStatus,
      storeId,
    ],
  );

  useEffect(() => {
    if (!open) return;
    setActiveSignature(null);
    setOptimisticStatuses(null);
    setSignatureLoading(false);
  }, [contract?.id, open]);

  useEffect(() => {
    if (!contract) return;
    if (
      contract.patientSignatureStatus !== 'unsigned' ||
      contract.responsibleSignatureStatus !== 'unsigned'
    ) {
      setOptimisticStatuses(null);
    }
  }, [
    contract,
    contract?.patientSignatureStatus,
    contract?.responsibleSignatureStatus,
  ]);

  useEffect(() => {
    if (!open || !contract) return;
    if (
      patientSignatureStatus === 'unsigned' &&
      responsibleSignatureStatus === 'unsigned'
    ) {
      setSignatureLoading(false);
      return;
    }
    setSignatureLoading(true);
    void loadSignature({ sync: false });
  }, [
    contract?.id,
    loadSignature,
    open,
    patientSignatureStatus,
    responsibleSignatureStatus,
  ]);

  useEffect(() => {
    if (!open || !activeSignature || activeSignature.status !== 'pending') return;

    const intervalId = window.setInterval(() => {
      void loadSignature({ sync: true }).then(() => {
        void invalidateContracts();
      });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeSignature, invalidateContracts, loadSignature, open]);

  const handlePrint = async () => {
    if (!contract || !storeId) return;

    setIsPrinting(true);
    try {
      await printPatientContractDocument({
        storeId,
        patientId,
        contract,
        signature: activeSignature,
      });
    } catch {
      toast.error('Não foi possível imprimir o contrato assinado.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleOpenRequestModal = async () => {
    if (!contract || !storeId || !canRequestSignature) return;
    if (await isSignatureCreditBalanceEmpty(storeId)) {
      setCreditsInsufficientOpen(true);
      return;
    }
    try {
      const clinicProfile = await getClinicProfile(storeId);
      setClinicName(clinicProfile.clinicName || '');
      setDefaultResponsible({
        name:
          clinicProfile.clinicName ||
          contract.responsibleName ||
          clinicProfile.responsible ||
          '',
        email: clinicProfile.email || '',
        phone: clinicProfile.mobile || clinicProfile.phone || '',
      });
      setRequestSheetOpen(true);
    } catch {
      setClinicName('');
      setDefaultResponsible({
        name: contract.responsibleName || '',
        email: '',
        phone: '',
      });
      setRequestSheetOpen(true);
    }
  };

  const handleConfirmSignatureRequest = async (
    input: ContractSignatureRequestConfirm,
  ) => {
    if (!contract || !storeId) return;

    setSignatureRequesting(true);
    try {
      if (await isSignatureCreditBalanceEmpty(storeId)) {
        setCreditsInsufficientOpen(true);
        return;
      }

      const blob = await buildPatientContractPdf({
        title: contract.templateName,
        htmlContent: contract.content,
      });
      const fileBase64 = await blobToBase64(blob);
      const signature = await requestContractSignature(storeId, patientId, contract.id, {
        fileBase64,
        signerEmail: input.signerEmail,
        responsible: {
          name: input.responsible.name,
          email: input.responsible.email || undefined,
          phone: input.responsible.phone || undefined,
        },
      });
      invalidateSignatureCredits(queryClient, storeId);
      setRequestSheetOpen(false);
      setOptimisticStatuses({ patient: 'pending', responsible: 'pending' });
      setActiveSignature(signature);
      onContractUpdated?.({
        ...contract,
        patientSignatureStatus: 'pending',
        responsibleSignatureStatus: 'pending',
      });
      await invalidateContracts();
      toast.success('Assinatura solicitada. Os signatários receberão o e-mail quando cadastrado.');
    } catch (error) {
      if (isSignatureCreditsInsufficientError(error)) {
        setCreditsInsufficientOpen(true);
        return;
      }
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível solicitar a assinatura do contrato.',
      );
    } finally {
      setSignatureRequesting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!contract) return;

    try {
      await deleteMutation.mutateAsync(contract.id);
      toast.success('Contrato excluído.');
      setConfirmDeleteOpen(false);
      onOpenChange(false);
      onDeleted();
    } catch {
      toast.error('Não foi possível excluir o contrato.');
    }
  };

  const showAccordion = Boolean(activeSignature);
  const showAccordionPlaceholder =
    hasPendingOrSigned && signatureLoading && !activeSignature;
  const canEditContract = canRequestSignature;

  const signatureBlock = useMemo(() => {
    if (!contract) return null;

    if (showAccordion && activeSignature && storeId) {
      return (
        <ContractSignatoriesAccordion
          storeId={storeId}
          signature={activeSignature}
          clinicName={contract.responsibleName}
          patientName={contract.patientName}
          onCancelled={() => {
            setActiveSignature(null);
            setOptimisticStatuses(null);
            onContractUpdated?.({
              ...contract,
              patientSignatureStatus: 'unsigned',
              responsibleSignatureStatus: 'unsigned',
            });
            void invalidateContracts();
          }}
        />
      );
    }

    if (showAccordionPlaceholder || (hasPendingOrSigned && !canRequestSignature)) {
      return (
        <div
          className="w-full overflow-hidden rounded-lg border border-border bg-background px-4 py-3"
          aria-busy={showAccordionPlaceholder}
          aria-label={
            showAccordionPlaceholder ? 'Carregando signatários' : 'Assinatura em andamento'
          }
        >
          <div className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-foreground" aria-hidden />
            <span className="text-base font-bold text-foreground">Signatários:</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-base text-muted-foreground">
              {contract.responsibleName || '—'}
              <span className="mx-1.5" aria-hidden>
                |
              </span>
              {contract.patientName || '—'}
            </p>
            <ContractSignatureBadge
              responsibleStatus={responsibleSignatureStatus}
              patientStatus={patientSignatureStatus}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
        <Users className="size-4 shrink-0 text-foreground" aria-hidden />
        <span className="font-medium text-foreground">Signatários:</span>
        <span className="text-muted-foreground">{contract.responsibleName}</span>
        <span className="text-muted-foreground" aria-hidden>
          |
        </span>
        <span className="text-muted-foreground">{contract.patientName}</span>
        <ContractSignatureBadge
          responsibleStatus={responsibleSignatureStatus}
          patientStatus={patientSignatureStatus}
        />
        {canRequestSignature ? (
          <Button
            type="button"
            size="sm"
            className="ml-auto"
            onClick={() => void handleOpenRequestModal()}
          >
            <FileSignature className="size-4" />
            Assinatura eletrônica
          </Button>
        ) : null}
      </div>
    );
  }, [
    activeSignature,
    canRequestSignature,
    contract,
    hasPendingOrSigned,
    invalidateContracts,
    onContractUpdated,
    patientSignatureStatus,
    responsibleSignatureStatus,
    showAccordion,
    showAccordionPlaceholder,
    storeId,
  ]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          {...CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS}
          className={cn('flex flex-col gap-0 p-0', CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS)}
        >
          <SheetHeader className={cn(CLINIC_SHEET_HEADER_CLASS, 'text-left')}>
            <SheetTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-lg">
              <span>{contract?.templateName ?? 'Contrato'}</span>
              {contract ? (
                <>
                  <span className="font-normal text-muted-foreground" aria-hidden>
                    |
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {formatPatientContractPreviewIssuedLabel(
                      contract.issuedAt,
                      Boolean(contract.budgetId),
                    )}
                  </span>
                </>
              ) : null}
            </SheetTitle>
          </SheetHeader>

          <div className={cn(CLINIC_SHEET_SCROLL_BODY_CLASS, 'bg-muted/30 p-6')}>
            {contract ? (
              <div className="mx-auto w-[210mm] max-w-full space-y-4">
                {signatureBlock}
                <style>{PATIENT_CONTRACT_PAPER_CSS}</style>
                <div
                  data-rte-paper="true"
                  dangerouslySetInnerHTML={{ __html: contract.content }}
                />
              </div>
            ) : (
              <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
                Carregando contrato…
              </div>
            )}
          </div>

          <SheetFooter className={cn(CLINIC_SHEET_FOOTER_CLASS, 'flex-wrap')}>
            <Button
              type="button"
              variant="ghost"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              disabled={!contract || isPrinting}
              onClick={() => void handlePrint()}
            >
              <Printer className="mr-2 size-4" aria-hidden />
              Imprimir
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                CLINIC_SHEET_FOOTER_BUTTON_CLASS,
                'text-destructive hover:bg-destructive/10 hover:text-destructive',
              )}
              disabled={!contract}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 className="mr-2 size-4" aria-hidden />
              Excluir
            </Button>
            {!canEditContract ? null : (
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
                  'text-primary hover:bg-primary/10 hover:text-primary',
                )}
                disabled={!contract}
                onClick={() => {
                  if (contract) {
                    onEdit(contract);
                  }
                }}
              >
                <Pencil className="mr-2 size-4" aria-hidden />
                Editar
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <PatientContractSignatureRequestSheet
        open={requestSheetOpen}
        onOpenChange={setRequestSheetOpen}
        contract={contract}
        clinicName={clinicName}
        patientName={patient.name || contract?.patientName || ''}
        patientEmail={patient.email || ''}
        defaultResponsible={defaultResponsible}
        isSubmitting={signatureRequesting}
        onConfirm={handleConfirmSignatureRequest}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deleteMutation.isPending) {
            setConfirmDeleteOpen(false);
          }
        }}
        title="Excluir contrato"
        description={
          contract
            ? `Tem certeza que deseja excluir o contrato "${contract.templateName}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />

      <SignatureCreditsInsufficientDialog
        open={creditsInsufficientOpen}
        onOpenChange={setCreditsInsufficientOpen}
      />
    </>
  );
}
