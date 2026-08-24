'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileSignature, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@citybox/ui';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import { useStore } from '@/lib/store-context';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import {
  cancelElectronicSignature,
  getElectronicSignature,
} from '../../../services/electronic-signatures.service';
import { getPatientAnamnesisById } from '../../../services/patient-anamnesis.service';
import { getPatientContractEmissionById } from '../../../services/patient-contract-emissions.service';
import { listPatientEvolutions } from '../../../services/patient-evolutions.service';
import {
  buildPatientAnamnesisPdf,
  mapClinicSettingsToAnamnesisPdfClinic,
} from '../../../lib/build-patient-anamnesis-pdf';
import {
  buildPatientEvolutionPdf,
  mapClinicSettingsToEvolutionPdfClinic,
} from '../../../lib/build-patient-evolution-pdf';
import {
  formatPendingSignatureDaysLabel,
  formatSignatureRequestedAtDate,
  PATIENT_SIGNATURE_KIND_LABEL,
} from '../../../lib/patient-pending-signatures';
import { usePatientPendingSignaturesQuery } from '../../../hooks/use-patient-pending-signatures-query';
import { patientSignatureKeys } from '../../../hooks/query-keys';
import type { ElectronicSignature } from '../../../types/electronic-signature';
import type { ClinicPatient } from '../../../types/clinic-patient';
import type { PatientAnamnesis } from '../../../types/patient-anamnesis';
import type { PatientContractEmissionRecord } from '../../../types/patient-contract-emission';
import { PatientSignatureIssuedDialog } from '../signatures/patient-signature-issued-dialog';
import { PatientCancelSignatureDialog } from '../signatures/patient-cancel-signature-dialog';
import { PatientAnamnesisPdfSheet } from '../anamnesis/patient-anamnesis-pdf-sheet';
import { PatientContractPreviewSheet } from '../documents/contracts/patient-contract-preview-sheet';
import { PatientTreatmentEvolutionPdfSheet } from '../treatments/patient-treatment-evolution-pdf-sheet';

const ABOUT_PANEL_CLASS = 'rounded-2xl border border-border/60 bg-card p-5';
const ISSUED_DIALOG_POLL_MS = 8_000;

type PatientPendingSignaturesCardProps = {
  patient: ClinicPatient;
  className?: string;
};

export function PatientPendingSignaturesCard({
  patient,
  className,
}: PatientPendingSignaturesCardProps) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = usePatientPendingSignaturesQuery(
    patient.id,
  );

  const [shareOpen, setShareOpen] = useState(false);
  const [shareSignature, setShareSignature] =
    useState<ElectronicSignature | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ElectronicSignature | null>(
    null,
  );
  const [cancelling, setCancelling] = useState(false);

  const [anamnesisPdfOpen, setAnamnesisPdfOpen] = useState(false);
  const [anamnesisView, setAnamnesisView] = useState<PatientAnamnesis | null>(
    null,
  );
  const [anamnesisPdfBlob, setAnamnesisPdfBlob] = useState<Blob | null>(null);

  const [contractPreviewOpen, setContractPreviewOpen] = useState(false);
  const [previewContract, setPreviewContract] =
    useState<PatientContractEmissionRecord | null>(null);

  const [evolutionPdfOpen, setEvolutionPdfOpen] = useState(false);
  const [evolutionPdfBlob, setEvolutionPdfBlob] = useState<Blob | null>(null);

  const [viewLoadingId, setViewLoadingId] = useState<string | null>(null);

  const invalidatePendingList = useCallback(() => {
    if (!storeId) return;
    void queryClient.invalidateQueries({
      queryKey: patientSignatureKeys.all(storeId, patient.id),
    });
  }, [patient.id, queryClient, storeId]);

  const handleShare = useCallback(
    async (signature: ElectronicSignature) => {
      if (!storeId) return;
      try {
        const fresh = await getElectronicSignature(
          storeId,
          patient.id,
          signature.id,
        );
        setShareSignature(fresh);
        setShareOpen(true);
      } catch {
        toast.error('Não foi possível carregar o link de assinatura.');
      }
    },
    [patient.id, storeId],
  );

  const shareSignatureId = shareSignature?.id ?? null;
  const shareSignaturePending = shareSignature?.status === 'pending';

  useEffect(() => {
    if (
      !shareOpen ||
      !storeId ||
      !shareSignatureId ||
      !shareSignaturePending
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void (async () => {
        try {
          const fresh = await getElectronicSignature(
            storeId,
            patient.id,
            shareSignatureId,
          );
          setShareSignature(fresh);
          if (fresh.status !== 'pending') {
            invalidatePendingList();
          }
        } catch {
          // Polling is best-effort.
        }
      })();
    }, ISSUED_DIALOG_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [
    invalidatePendingList,
    patient.id,
    shareOpen,
    shareSignatureId,
    shareSignaturePending,
    storeId,
  ]);

  const handleConfirmCancel = useCallback(async () => {
    if (!storeId || !cancelTarget) return;
    setCancelling(true);
    try {
      await cancelElectronicSignature(storeId, patient.id, cancelTarget.id);
      toast.success('Solicitação de assinatura cancelada.');
      setCancelTarget(null);
      invalidatePendingList();
    } catch {
      toast.error('Não foi possível cancelar a solicitação.');
    } finally {
      setCancelling(false);
    }
  }, [cancelTarget, invalidatePendingList, patient.id, storeId]);

  const handleViewDocument = useCallback(
    async (signature: ElectronicSignature) => {
      if (!storeId) return;
      setViewLoadingId(signature.id);
      try {
        if (signature.kind === 'anamnesis') {
          const targetId = signature.targetId;
          if (!targetId) {
            throw new Error('missing anamnesis target');
          }
          const anamnesis = await getPatientAnamnesisById(
            storeId,
            patient.id,
            targetId,
          );
          const clinicProfile = await getClinicProfile(storeId);
          const blob = await buildPatientAnamnesisPdf({
            patientName: patient.name,
            patientPhone: patient.phone,
            patientBirthDate: patient.birthDate,
            patientGender: patient.gender,
            patientAddress: patient.address,
            anamnesis,
            clinic: mapClinicSettingsToAnamnesisPdfClinic(clinicProfile),
          });
          setAnamnesisView(anamnesis);
          setAnamnesisPdfBlob(blob);
          setAnamnesisPdfOpen(true);
          return;
        }

        if (signature.kind === 'contract') {
          const targetId = signature.targetId;
          if (!targetId) {
            throw new Error('missing contract target');
          }
          const contract = await getPatientContractEmissionById(
            storeId,
            patient.id,
            targetId,
          );
          setPreviewContract(contract);
          setContractPreviewOpen(true);
          return;
        }

        const targetIds =
          signature.targetIds && signature.targetIds.length > 0
            ? signature.targetIds
            : signature.targetId
              ? [signature.targetId]
              : [];
        if (targetIds.length === 0) {
          throw new Error('missing evolution targets');
        }
        const evolutions = await listPatientEvolutions(storeId, patient.id);
        const selected = evolutions.filter((item) =>
          targetIds.includes(item.id),
        );
        if (selected.length === 0) {
          throw new Error('evolutions not found');
        }
        const clinicProfile = await getClinicProfile(storeId);
        const blob = await buildPatientEvolutionPdf({
          patientName: patient.name,
          patientPhone: patient.phone,
          patientBirthDate: patient.birthDate,
          evolutions: selected,
          clinic: mapClinicSettingsToEvolutionPdfClinic(clinicProfile),
        });
        setEvolutionPdfBlob(blob);
        setEvolutionPdfOpen(true);
      } catch {
        toast.error('Não foi possível abrir o documento.');
      } finally {
        setViewLoadingId(null);
      }
    },
    [patient, storeId],
  );

  if (isLoading) {
    return null;
  }

  if (isError) {
    return (
      <section className={cn(ABOUT_PANEL_CLASS, className)}>
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground"
            aria-hidden
          >
            <FileSignature className="size-4" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Assinaturas pendentes
          </h3>
        </div>
        <p className="mt-3 text-sm text-destructive">
          Não foi possível carregar as assinaturas pendentes.
        </p>
      </section>
    );
  }

  if (!data || data.meta.total === 0) {
    return null;
  }

  const items = data.items;

  return (
    <>
      <section className={cn(ABOUT_PANEL_CLASS, className)}>
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground"
            aria-hidden
          >
            <FileSignature className="size-4" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Assinaturas pendentes
          </h3>
        </div>

        <ul className="mt-3 divide-y divide-border/60">
          {items.map((signature) => (
            <li
              key={signature.id}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <time
                dateTime={signature.requestedAt}
                className="shrink-0 text-sm tabular-nums text-foreground"
              >
                {formatSignatureRequestedAtDate(signature.requestedAt)}
              </time>

              <span className="min-w-0 flex-1 text-center text-sm font-medium text-foreground">
                {PATIENT_SIGNATURE_KIND_LABEL[signature.kind]}
              </span>

              <span className="shrink-0 text-sm text-muted-foreground">
                {formatPendingSignatureDaysLabel(signature.requestedAt)}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label="Ações da assinatura pendente"
                    disabled={viewLoadingId === signature.id}
                  >
                    <MoreHorizontal className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void handleShare(signature)}>
                    Compartilhar link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => void handleViewDocument(signature)}
                  >
                    Ver documento
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setCancelTarget(signature)}
                  >
                    Cancelar assinatura
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      </section>

      <PatientSignatureIssuedDialog
        open={shareOpen}
        onOpenChange={(open) => {
          setShareOpen(open);
          if (!open) {
            setShareSignature(null);
            invalidatePendingList();
          }
        }}
        storeId={storeId ?? ''}
        signature={shareSignature}
      />

      <PatientCancelSignatureDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open && !cancelling) setCancelTarget(null);
        }}
        isCancelling={cancelling}
        onConfirm={handleConfirmCancel}
      />

      <PatientAnamnesisPdfSheet
        open={anamnesisPdfOpen}
        onOpenChange={(open) => {
          setAnamnesisPdfOpen(open);
          if (!open) {
            setAnamnesisView(null);
            setAnamnesisPdfBlob(null);
          }
        }}
        patientName={patient.name}
        anamnesis={anamnesisView}
        pdfBlob={anamnesisPdfBlob}
        mode="view"
      />

      <PatientContractPreviewSheet
        open={contractPreviewOpen}
        onOpenChange={(open) => {
          setContractPreviewOpen(open);
          if (!open) setPreviewContract(null);
        }}
        patientId={patient.id}
        contract={previewContract}
        onEdit={() => {
          toast.info('Edite o contrato na aba Documentos.');
        }}
        onDeleted={() => {
          setContractPreviewOpen(false);
          setPreviewContract(null);
          invalidatePendingList();
        }}
        onContractUpdated={(contract) => {
          setPreviewContract(contract);
          invalidatePendingList();
        }}
      />

      <PatientTreatmentEvolutionPdfSheet
        open={evolutionPdfOpen}
        onOpenChange={(open) => {
          setEvolutionPdfOpen(open);
          if (!open) setEvolutionPdfBlob(null);
        }}
        patientName={patient.name}
        pdfBlob={evolutionPdfBlob}
        mode="view"
      />
    </>
  );
}
