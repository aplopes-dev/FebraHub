'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@citybox/ui/organisms';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  getPatientAnamnesisMutationErrorMessage,
  usePatientAnamnesisMutations,
  usePatientAnamnesesQuery,
} from '../../../hooks/use-patient-anamnesis-queries';
import { useDebouncedSearch } from '../../../hooks/use-debounced-search';
import { buildPatientAnamnesisPdf, mapClinicSettingsToAnamnesisPdfClinic } from '../../../lib/build-patient-anamnesis-pdf';
import { blobToBase64 } from '../../../lib/blob-to-base64';
import {
  setSkipAnamnesisEmailPrompt,
  shouldSkipAnamnesisEmailPrompt,
} from '../../../lib/anamnesis-signature-email-preference';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { toApiAnamnesisSort, type PatientAnamnesisSort } from '../../../lib/sort-patient-anamneses';
import { getPatientAnamnesisById } from '../../../services/patient-anamnesis.service';
import {
  cancelElectronicSignature,
  fetchSignedPdfBlob,
  getElectronicSignatureByTarget,
  requestAnamnesisSignature,
} from '../../../services/electronic-signatures.service';
import {
  getPatientById,
  updatePatient,
} from '../../../services/patients.service';
import { anamnesisKeys } from '../../../hooks/query-keys';
import { invalidateSignatureCredits } from '@/features/clinic/loja/lib/invalidate-signature-credits';
import {
  isSignatureCreditBalanceEmpty,
  isSignatureCreditsInsufficientError,
} from '@/features/clinic/loja/lib/signature-credits-insufficient';
import { SignatureCreditsInsufficientDialog } from '@/features/clinic/loja/components/signature-credits-insufficient-dialog';
import type { ElectronicSignature } from '../../../types/electronic-signature';
import type { PatientAnamnesis, PatientAnamnesisAnswer } from '../../../types/patient-anamnesis';
import type { PatientAddress } from '../../../types/clinic-patient';
import type { PatientGender } from '../../../types/patient-form';
import type { PatientAnamnesisListMeta } from '../../../types/patient-anamnesis-api';
import { PatientAnamnesisNewSheet } from '../anamnesis/patient-anamnesis-new-sheet';
import {
  PatientAnamnesisPdfSheet,
  type PatientAnamnesisPdfSheetMode,
} from '../anamnesis/patient-anamnesis-pdf-sheet';
import { PatientAnamnesisShareDialog } from '../anamnesis/patient-anamnesis-share-dialog';
import { PatientAnamnesisSignatureEmailDialog } from '../anamnesis/patient-anamnesis-signature-email-dialog';
import { PatientAnamnesisSignatureIssuedDialog } from '../anamnesis/patient-anamnesis-signature-issued-dialog';
import { PatientAnamnesisCancelSignatureDialog } from '../anamnesis/patient-anamnesis-cancel-signature-dialog';
import { PatientAnamnesesHeader } from '../anamnesis/patient-anamneses-header';
import { PatientAnamnesesTable } from '../anamnesis/patient-anamneses-table';
import type { PatientAnamnesisAction } from '../anamnesis/patient-anamnesis-actions-menu';
import {
  PATIENT_ANAMNESIS_PAGE_SIZE_OPTIONS,
  type PatientAnamnesisPageSize,
} from '../anamnesis/patient-anamneses-pagination-bar';

type PatientAnamnesisTabProps = {
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientBirthDate: string;
  patientGender: PatientGender;
  patientAddress: PatientAddress;
};

const DEFAULT_PAGE_SIZE: PatientAnamnesisPageSize = PATIENT_ANAMNESIS_PAGE_SIZE_OPTIONS[1];

const DEFAULT_META: PatientAnamnesisListMeta = {
  total: 0,
  page: 1,
  perPage: DEFAULT_PAGE_SIZE,
  totalPages: 0,
};

export function PatientAnamnesisTab({
  patientId,
  patientName,
  patientEmail: patientEmailProp,
  patientPhone,
  patientBirthDate,
  patientGender,
  patientAddress,
}: PatientAnamnesisTabProps) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();
  const { search, debouncedSearch, handleSearchChange } = useDebouncedSearch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PatientAnamnesisPageSize>(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<PatientAnamnesisSort | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      perPage: pageSize,
      search: debouncedSearch,
      ...toApiAnamnesisSort(sort),
    }),
    [debouncedSearch, page, pageSize, sort],
  );

  const { data } = usePatientAnamnesesQuery(patientId, listParams);
  const { createMutation, deleteMutation } = usePatientAnamnesisMutations(patientId);

  const anamneses = data?.items ?? [];
  const meta = data?.meta ?? DEFAULT_META;

  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [anamnesisToDelete, setAnamnesisToDelete] = useState<PatientAnamnesis | null>(null);
  const [viewingAnamnesis, setViewingAnamnesis] = useState<PatientAnamnesis | null>(null);
  const [pdfSheetOpen, setPdfSheetOpen] = useState(false);
  const [pdfSheetMode, setPdfSheetMode] =
    useState<PatientAnamnesisPdfSheetMode>('view');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingAnamnesis, setSharingAnamnesis] = useState<PatientAnamnesis | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [signatureRequesting, setSignatureRequesting] = useState(false);
  const [activeSignature, setActiveSignature] = useState<ElectronicSignature | null>(null);
  const [issuedDialogOpen, setIssuedDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [creditsInsufficientOpen, setCreditsInsufficientOpen] = useState(false);
  const [patientEmail, setPatientEmail] = useState(patientEmailProp);
  const [signatureRequestedAtById, setSignatureRequestedAtById] = useState<
    Record<string, string>
  >({});
  const [anamnesisToCancelSignature, setAnamnesisToCancelSignature] =
    useState<PatientAnamnesis | null>(null);
  const [cancellingSignature, setCancellingSignature] = useState(false);
  const pendingSignatureSyncRef = useRef<string>('');

  const rememberSignatureRequestedAt = useCallback(
    (anamnesisId: string, requestedAt: string) => {
      setSignatureRequestedAtById((prev) => {
        if (prev[anamnesisId] === requestedAt) return prev;
        return { ...prev, [anamnesisId]: requestedAt };
      });
    },
    [],
  );

  useEffect(() => {
    setPatientEmail(patientEmailProp);
  }, [patientEmailProp]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize, sort]);

  useEffect(() => {
    if (!viewingAnamnesis || !storeId) {
      setPdfBlob(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        if (viewingAnamnesis.signatureStatus === 'signed') {
          const signature = await getElectronicSignatureByTarget(
            storeId,
            patientId,
            'anamnesis',
            viewingAnamnesis.id,
          );
          if (!signature.hasSignedPdf) {
            throw new Error('PDF assinado ainda não disponível.');
          }
          const blob = await fetchSignedPdfBlob(
            storeId,
            patientId,
            signature.id,
          );
          if (!cancelled) {
            setPdfBlob(blob);
          }
          return;
        }

        const clinicProfile = await getClinicProfile(storeId);
        const blob = await buildPatientAnamnesisPdf({
          patientName,
          patientPhone,
          patientBirthDate,
          patientGender,
          patientAddress,
          anamnesis: viewingAnamnesis,
          clinic: mapClinicSettingsToAnamnesisPdfClinic(clinicProfile),
        });

        if (!cancelled) {
          setPdfBlob(blob);
        }
      } catch {
        if (!cancelled) {
          setPdfBlob(null);
          toast.error(
            viewingAnamnesis.signatureStatus === 'signed'
              ? 'Não foi possível carregar o PDF assinado da anamnese.'
              : 'Não foi possível gerar o PDF da anamnese.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    viewingAnamnesis,
    patientId,
    patientName,
    patientPhone,
    patientBirthDate,
    patientGender,
    patientAddress,
    storeId,
  ]);

  const invalidateAnamneses = useCallback(async () => {
    if (!storeId) return;
    await queryClient.invalidateQueries({
      queryKey: anamnesisKeys.all(storeId, patientId),
    });
  }, [patientId, queryClient, storeId]);

  const openIssuedDialog = useCallback((signature: ElectronicSignature) => {
    setActiveSignature(signature);
    setIssuedDialogOpen(true);
  }, []);

  /** Sync ZapSign → anamnese.signatureStatus e atualiza a lista quando assinado. */
  const loadAnamnesisSignature = useCallback(
    async (anamnesisId: string, options?: { sync?: boolean }) => {
      if (!storeId) return null;
      const signature = await getElectronicSignatureByTarget(
        storeId,
        patientId,
        'anamnesis',
        anamnesisId,
        { sync: options?.sync === true },
      );
      setActiveSignature(signature);
      if (signature.requestedAt) {
        rememberSignatureRequestedAt(anamnesisId, signature.requestedAt);
      }
      if (
        signature.status === 'signed' ||
        signature.signers.every((signer) => signer.status === 'signed')
      ) {
        await invalidateAnamneses();
      }
      return signature;
    },
    [invalidateAnamneses, patientId, rememberSignatureRequestedAt, storeId],
  );

  // Poll enquanto o modal de assinatura pendente está aberto (webhook local pode não chegar).
  useEffect(() => {
    if (!issuedDialogOpen || !activeSignature || activeSignature.status !== 'pending') {
      return;
    }
    const targetId = activeSignature.targetId;
    if (!targetId) return;

    const intervalId = window.setInterval(() => {
      void loadAnamnesisSignature(targetId, { sync: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeSignature, issuedDialogOpen, loadAnamnesisSignature]);

  const pendingSignatureIdsKey = useMemo(
    () =>
      (data?.items ?? [])
        .filter((item) => item.signatureStatus === 'pending')
        .map((item) => item.id)
        .sort()
        .join(','),
    [data?.items],
  );

  // Hidrata "Emitido" pelo banco; ZapSign sync em background.
  useEffect(() => {
    if (!storeId || !pendingSignatureIdsKey) return;

    const pendingIds = pendingSignatureIdsKey.split(',');
    let cancelled = false;

    void (async () => {
      await Promise.all(
        pendingIds.map(async (anamnesisId) => {
          try {
            const signature = await getElectronicSignatureByTarget(
              storeId,
              patientId,
              'anamnesis',
              anamnesisId,
            );
            // Aplica mesmo se o effect foi refeito — a data é idempotente e barata.
            if (signature.requestedAt) {
              rememberSignatureRequestedAt(anamnesisId, signature.requestedAt);
            }
          } catch {
            // Ignora falha pontual — Ver assinatura força sync sob demanda.
          }
        }),
      );

      if (cancelled) return;

      if (pendingSignatureSyncRef.current === pendingSignatureIdsKey) return;
      pendingSignatureSyncRef.current = pendingSignatureIdsKey;

      let anySigned = false;
      await Promise.all(
        pendingIds.map(async (anamnesisId) => {
          try {
            const signature = await getElectronicSignatureByTarget(
              storeId,
              patientId,
              'anamnesis',
              anamnesisId,
              { sync: true },
            );
            if (cancelled) return;
            if (signature.requestedAt) {
              rememberSignatureRequestedAt(anamnesisId, signature.requestedAt);
            }
            if (
              signature.status === 'signed' ||
              signature.signers.every((signer) => signer.status === 'signed')
            ) {
              anySigned = true;
            }
          } catch {
            // Ignora falha pontual.
          }
        }),
      );

      if (cancelled) return;
      if (anySigned) {
        pendingSignatureSyncRef.current = '';
        await invalidateAnamneses();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    invalidateAnamneses,
    patientId,
    pendingSignatureIdsKey,
    rememberSignatureRequestedAt,
    storeId,
  ]);

  const handleNewAnamnesis = useCallback(() => {
    setNewSheetOpen(true);
  }, []);

  const handleSaveNewAnamnesis = useCallback(
    async (input: {
      templateId: string;
      fillingMode: PatientAnamnesis['fillingMode'];
      consultationReason: string;
      answers: Record<string, PatientAnamnesisAnswer>;
    }) => {
      try {
        const created = await createMutation.mutateAsync(input);
        setNewSheetOpen(false);

        if (created.fillingMode === 'patient') {
          setSharingAnamnesis(created);
          setShareDialogOpen(true);
          toast.success('Anamnese enviada para o paciente.');
          return;
        }

        setPdfSheetMode('view');
        setViewingAnamnesis(created);
        setPdfSheetOpen(true);
        toast.success('Anamnese emitida com sucesso.');
      } catch (error) {
        toast.error(getPatientAnamnesisMutationErrorMessage(error));
      }
    },
    [createMutation],
  );

  const handleShareDialogOpenChange = useCallback((open: boolean) => {
    setShareDialogOpen(open);
    if (!open) {
      setSharingAnamnesis(null);
    }
  }, []);

  const resolveAnamnesisDetail = useCallback(
    async (anamnesis: PatientAnamnesis) => {
      if (anamnesis.answers && anamnesis.questionsSnapshot) {
        return anamnesis;
      }

      if (!storeId) {
        throw new Error('Loja não selecionada.');
      }

      return getPatientAnamnesisById(storeId, patientId, anamnesis.id);
    },
    [patientId, storeId],
  );

  const executeSignatureRequest = useCallback(
    async (signerEmail?: string) => {
      if (!viewingAnamnesis || !storeId) return;

      setSignatureRequesting(true);
      try {
        if (await isSignatureCreditBalanceEmpty(storeId)) {
          setCreditsInsufficientOpen(true);
          return;
        }

        let blob = pdfBlob;
        if (!blob) {
          const detail = await resolveAnamnesisDetail(viewingAnamnesis);
          const clinicProfile = await getClinicProfile(storeId);
          blob = await buildPatientAnamnesisPdf({
            patientName,
            patientPhone,
            patientBirthDate,
            patientGender,
            patientAddress,
            anamnesis: detail,
            clinic: mapClinicSettingsToAnamnesisPdfClinic(clinicProfile),
          });
        }

        const fileBase64 = await blobToBase64(blob);
        const signature = await requestAnamnesisSignature(
          storeId,
          patientId,
          viewingAnamnesis.id,
          {
            fileBase64,
            signerEmail: signerEmail?.trim() || undefined,
          },
        );

        invalidateSignatureCredits(queryClient, storeId);
        setEmailDialogOpen(false);
        setPdfSheetOpen(false);
        setViewingAnamnesis(null);
        setPdfSheetMode('view');
        if (signature.requestedAt) {
          rememberSignatureRequestedAt(viewingAnamnesis.id, signature.requestedAt);
        }
        await invalidateAnamneses();
        openIssuedDialog(signature);
        toast.success('Assinatura solicitada. Envie o link ao paciente.');
      } catch (error) {
        if (isSignatureCreditsInsufficientError(error)) {
          setCreditsInsufficientOpen(true);
          return;
        }
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível solicitar a assinatura.',
        );
      } finally {
        setSignatureRequesting(false);
      }
    },
    [
      invalidateAnamneses,
      openIssuedDialog,
      patientAddress,
      patientBirthDate,
      patientGender,
      patientId,
      patientName,
      patientPhone,
      pdfBlob,
      queryClient,
      rememberSignatureRequestedAt,
      resolveAnamnesisDetail,
      storeId,
      viewingAnamnesis,
    ],
  );

  const handleRequestSignatureClick = useCallback(() => {
    if (!viewingAnamnesis || !storeId) return;

    const hasEmail = Boolean(patientEmail.trim());
    const skipPrompt = shouldSkipAnamnesisEmailPrompt(patientId);

    if (!hasEmail && !skipPrompt) {
      setEmailDialogOpen(true);
      return;
    }

    void executeSignatureRequest(patientEmail || undefined);
  }, [
    executeSignatureRequest,
    patientEmail,
    patientId,
    storeId,
    viewingAnamnesis,
  ]);

  const handleEmailContinue = useCallback(
    async (input: { email: string; dontShowAgain: boolean }) => {
      if (!storeId) return;

      if (input.dontShowAgain) {
        setSkipAnamnesisEmailPrompt(patientId, true);
      }

      const nextEmail = input.email.trim();
      if (nextEmail) {
        try {
          const { form } = await getPatientById(storeId, patientId);
          await updatePatient(storeId, patientId, {
            ...form,
            email: nextEmail,
          });
          setPatientEmail(nextEmail);
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Não foi possível atualizar o e-mail.',
          );
          return;
        }
      }

      await executeSignatureRequest(nextEmail || undefined);
    },
    [executeSignatureRequest, patientId, storeId],
  );

  const handleAnamnesisAction = useCallback(
    async (anamnesis: PatientAnamnesis, action: PatientAnamnesisAction) => {
      switch (action) {
        case 'view':
          try {
            const detail = await resolveAnamnesisDetail(anamnesis);
            setPdfSheetMode('view');
            setViewingAnamnesis(detail);
            setPdfSheetOpen(true);
          } catch {
            toast.error('Não foi possível carregar a anamnese.');
          }
          return;
        case 'share-signature-link': {
          if (!storeId) {
            toast.error('Loja não selecionada.');
            return;
          }
          if (anamnesis.signatureStatus !== 'pending') {
            toast.error('Não há solicitação de assinatura pendente.');
            return;
          }
          try {
            const signature = await loadAnamnesisSignature(anamnesis.id);
            if (!signature) {
              toast.error('Não foi possível carregar a assinatura.');
              return;
            }
            openIssuedDialog(signature);
          } catch {
            toast.error('Não foi possível carregar a assinatura.');
          }
          return;
        }
        case 'cancel-signature':
          if (anamnesis.signatureStatus !== 'pending') {
            toast.error('Não há solicitação de assinatura pendente.');
            return;
          }
          setAnamnesisToCancelSignature(anamnesis);
          return;
        case 'emit-signature': {
          if (!storeId) {
            toast.error('Loja não selecionada.');
            return;
          }

          if (anamnesis.status !== 'issued' || anamnesis.signatureStatus !== 'unsigned') {
            toast.error('Esta anamnese não está pronta para assinatura.');
            return;
          }

          if (await isSignatureCreditBalanceEmpty(storeId)) {
            setCreditsInsufficientOpen(true);
            return;
          }

          try {
            const detail = await resolveAnamnesisDetail(anamnesis);
            setPdfSheetMode('request-signature');
            setViewingAnamnesis(detail);
            setPdfSheetOpen(true);
          } catch {
            toast.error('Não foi possível carregar a anamnese.');
          }
          return;
        }
        case 'delete':
          setAnamnesisToDelete(anamnesis);
          return;
        default:
          return;
      }
    },
    [loadAnamnesisSignature, openIssuedDialog, resolveAnamnesisDetail, storeId],
  );

  const handlePdfSheetOpenChange = useCallback((open: boolean) => {
    setPdfSheetOpen(open);
    if (!open) {
      setViewingAnamnesis(null);
      setPdfSheetMode('view');
      setEmailDialogOpen(false);
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!anamnesisToDelete) return;

    try {
      await deleteMutation.mutateAsync(anamnesisToDelete.id);
      toast.success('Anamnese excluída.');
      setAnamnesisToDelete(null);
    } catch (error) {
      toast.error(getPatientAnamnesisMutationErrorMessage(error));
    }
  }, [anamnesisToDelete, deleteMutation]);

  const handleConfirmCancelSignature = useCallback(async () => {
    if (!anamnesisToCancelSignature || !storeId) return;

    setCancellingSignature(true);
    try {
      const signature = await getElectronicSignatureByTarget(
        storeId,
        patientId,
        'anamnesis',
        anamnesisToCancelSignature.id,
      );
      await cancelElectronicSignature(storeId, patientId, signature.id);
      setSignatureRequestedAtById((prev) => {
        if (!(anamnesisToCancelSignature.id in prev)) return prev;
        const next = { ...prev };
        delete next[anamnesisToCancelSignature.id];
        return next;
      });
      if (activeSignature?.id === signature.id) {
        setIssuedDialogOpen(false);
        setActiveSignature(null);
      }
      pendingSignatureSyncRef.current = '';
      await invalidateAnamneses();
      setAnamnesisToCancelSignature(null);
      toast.success('Solicitação de assinatura cancelada.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível cancelar a solicitação de assinatura.',
      );
    } finally {
      setCancellingSignature(false);
    }
  }, [
    activeSignature?.id,
    anamnesisToCancelSignature,
    invalidateAnamneses,
    patientId,
    storeId,
  ]);

  const emptyMessage = debouncedSearch
    ? 'Nenhuma anamnese encontrada para esta busca.'
    : 'Nenhuma anamnese cadastrada para este paciente.';

  return (
    <>
      <PatientAnamnesesTable
        anamneses={anamneses}
        meta={meta}
        page={page}
        pageSize={pageSize}
        sort={sort}
        emptyMessage={emptyMessage}
        signatureRequestedAtById={signatureRequestedAtById}
        header={
          <PatientAnamnesesHeader
            search={search}
            onSearchChange={handleSearchChange}
            onNewAnamnesis={handleNewAnamnesis}
          />
        }
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSortChange={setSort}
        onAnamnesisAction={(anamnesis, action) => void handleAnamnesisAction(anamnesis, action)}
      />

      <PatientAnamnesisNewSheet
        open={newSheetOpen}
        onOpenChange={setNewSheetOpen}
        patientId={patientId}
        isSaving={createMutation.isPending}
        onSave={handleSaveNewAnamnesis}
      />

      <PatientAnamnesisShareDialog
        open={shareDialogOpen}
        onOpenChange={handleShareDialogOpenChange}
        anamnesis={sharingAnamnesis}
        patientName={patientName}
        patientEmail={patientEmail}
        patientPhone={patientPhone}
      />

      <PatientAnamnesisPdfSheet
        open={pdfSheetOpen}
        onOpenChange={handlePdfSheetOpenChange}
        patientName={patientName}
        anamnesis={viewingAnamnesis}
        pdfBlob={pdfBlob}
        mode={pdfSheetMode}
        isRequestingSignature={signatureRequesting}
        onRequestSignature={handleRequestSignatureClick}
      />

      <PatientAnamnesisSignatureEmailDialog
        open={emailDialogOpen}
        onOpenChange={(open) => {
          if (!signatureRequesting) setEmailDialogOpen(open);
        }}
        patientName={patientName}
        isSubmitting={signatureRequesting}
        onContinue={handleEmailContinue}
      />

      {storeId ? (
        <PatientAnamnesisSignatureIssuedDialog
          open={issuedDialogOpen}
          onOpenChange={(open) => {
            setIssuedDialogOpen(open);
            if (!open) setActiveSignature(null);
          }}
          storeId={storeId}
          signature={activeSignature}
        />
      ) : null}

      <ConfirmDialog
        open={anamnesisToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setAnamnesisToDelete(null);
          }
        }}
        title="Excluir anamnese"
        description={
          anamnesisToDelete
            ? `Tem certeza que deseja excluir a anamnese "${anamnesisToDelete.templateName}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />

      <PatientAnamnesisCancelSignatureDialog
        open={anamnesisToCancelSignature !== null}
        onOpenChange={(open) => {
          if (!open && !cancellingSignature) {
            setAnamnesisToCancelSignature(null);
          }
        }}
        isCancelling={cancellingSignature}
        onConfirm={handleConfirmCancelSignature}
      />

      <SignatureCreditsInsufficientDialog
        open={creditsInsufficientOpen}
        onOpenChange={setCreditsInsufficientOpen}
      />
    </>
  );
}
