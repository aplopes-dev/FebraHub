'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@citybox/ui/organisms';
import {
  applyPatientTreatmentOrder,
  mergeReorderedPatientTreatmentIds,
} from '../../../lib/reorder-patient-treatments';
import { formatPatientTreatmentLabel } from '../../../lib/patient-treatment-ui';
import { patientDetailTabHref } from '../../../lib/patient-detail-tabs';
import {
  buildPatientEvolutionPdf,
  buildPatientEvolutionPdfFileName,
  mapClinicSettingsToEvolutionPdfClinic,
} from '../../../lib/build-patient-evolution-pdf';
import {
  buildPatientNutritionEvolutionsPdf,
  buildPatientNutritionPdf,
} from '../../../lib/build-patient-nutrition-pdf';
import { filterEvolutionsByIds } from '../../../lib/patient-evolution-selection';
import { downloadPatientEvolutionPdf } from '../../../lib/patient-evolution-pdf-actions';
import { blobToBase64 } from '../../../lib/blob-to-base64';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { useStore } from '@/lib/store-context';
import type { ClinicPlanLocationUiType } from '@/features/clinic/modules/settings/plans/data/specialty-location-ui-type';
import {
  storeShowsBodyMap,
  storeShowsNutritionInitializeFlow,
  storeShowsToothMap,
} from '@/lib/clinic-strand';
import { sortEvolutionsByDateDesc } from '../../../lib/patient-treatment-evolution';
import {
  fetchSignedPdfBlob,
  getElectronicSignatureByTarget,
  requestEvolutionBatchSignature,
} from '../../../services/electronic-signatures.service';
import { invalidateSignatureCredits } from '@/features/clinic/loja/lib/invalidate-signature-credits';
import {
  isSignatureCreditBalanceEmpty,
  isSignatureCreditsInsufficientError,
} from '@/features/clinic/loja/lib/signature-credits-insufficient';
import { SignatureCreditsInsufficientDialog } from '@/features/clinic/loja/components/signature-credits-insufficient-dialog';
import type { ElectronicSignature } from '../../../types/electronic-signature';
import { evolutionKeys } from '../../../hooks/query-keys';
import { useQueryClient } from '@tanstack/react-query';
import {
  getPatientEvolutionMutationErrorMessage,
  usePatientEvolutionMutations,
  usePatientEvolutionsQuery,
} from '../../../hooks/use-patient-evolutions-queries';
import {
  getPatientTreatmentMutationErrorMessage,
  usePatientNutritionInitiationsQuery,
  usePatientTreatmentMutations,
  usePatientTreatmentsQuery,
} from '../../../hooks/use-patient-treatments-queries';
import { indexNutritionInitiationsByEvolution } from '../../../lib/patient-nutrition-evolution-card';
import type {
  PatientTreatment,
  PatientTreatmentEditFormValues,
  PatientTreatmentEvolution,
  PatientStandaloneEvolutionPayload,
  PatientStandaloneTreatmentDraft,
  PatientTreatmentFinalizePayload,
} from '../../../types/patient-treatment';
import type { PatientTreatmentEvolutionAction } from '../treatments/patient-treatment-evolution-actions-menu';
import type { PatientTreatmentAction } from '../treatments/patient-treatment-actions-menu';
import { PatientBudgetTreatmentsPanel } from '../treatments/patient-budget-treatments-panel';
import { PatientTreatmentAddEvolutionSheet } from '../treatments/patient-treatment-add-evolution-sheet';
import { PatientTreatmentAddForm } from '../treatments/patient-treatment-add-form';
import { PatientTreatmentsCorpogramCard } from '../treatments/patient-treatments-corpogram-card';
import { PatientTreatmentsOdontogramCard } from '../treatments/patient-treatments-odontogram-card';
import { PatientTreatmentEmitEvolutionDialog } from '../treatments/patient-treatment-emit-evolution-dialog';
import { PatientTreatmentSignEvolutionDialog } from '../treatments/patient-treatment-sign-evolution-dialog';
import { PatientTreatmentEvolutionActionHistoryDialog } from '../treatments/patient-treatment-evolution-action-history-dialog';
import { PatientTreatmentEvolutionPanel } from '../treatments/patient-treatment-evolution-panel';
import {
  PatientTreatmentEvolutionPdfSheet,
  type PatientTreatmentEvolutionPdfSheetMode,
} from '../treatments/patient-treatment-evolution-pdf-sheet';
import { PatientTreatmentEditDialog } from '../treatments/patient-treatment-edit-dialog';
import { PatientTreatmentViewDialog } from '../treatments/patient-treatment-view-dialog';
import { PatientTreatmentFinalizeSheet } from '../treatments/patient-treatment-finalize-sheet';
import { PatientNutritionCompareSheet } from '../treatments/patient-nutrition-compare-sheet';
import { PatientNutritionInitSheet } from '../treatments/patient-nutrition-init-sheet';
import { PatientNutritionNoteDialog } from '../treatments/patient-nutrition-note-dialog';
import { PatientSignatureIssuedDialog } from '../signatures/patient-signature-issued-dialog';
import {
  usePatientNutritionNoteMutations,
  usePatientNutritionNotesQuery,
} from '../../../hooks/use-patient-nutrition-notes-queries';
import type { PatientNutritionNote } from '../../../types/patient-nutrition-note';
import type { PatientNutritionInitPayload } from '../../../types/patient-nutrition-init';
import {
  getPatientNutritionInitiation,
} from '../../../services/patient-treatments.service';
import { listPatientNutritionNotes } from '../../../services/patient-nutrition-notes.service';

type PatientTreatmentsTabProps = {
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientBirthDate?: string;
  patientGender?: string | null;
};

export function PatientTreatmentsTab({
  patientId,
  patientName,
  patientPhone,
  patientBirthDate,
  patientGender,
}: PatientTreatmentsTabProps) {
  const router = useRouter();
  const { storeId, clinicStrand } = useStore();
  const showToothMap = storeShowsToothMap(clinicStrand);
  const showBodyMap = storeShowsBodyMap(clinicStrand);
  const showNutritionInitializeFlow = storeShowsNutritionInitializeFlow(clinicStrand);
  const queryClient = useQueryClient();
  const [treatmentOrder, setTreatmentOrder] = useState<string[]>([]);
  const [treatmentToDelete, setTreatmentToDelete] = useState<PatientTreatment | null>(null);
  const [treatmentToEdit, setTreatmentToEdit] = useState<PatientTreatment | null>(null);
  const [treatmentToView, setTreatmentToView] = useState<PatientTreatment | null>(null);
  const [treatmentsToFinalize, setTreatmentsToFinalize] = useState<PatientTreatment[]>([]);
  const [finalizeSheetOpen, setFinalizeSheetOpen] = useState(false);
  const [treatmentToNutritionInit, setTreatmentToNutritionInit] =
    useState<PatientTreatment | null>(null);
  const [nutritionInitSheetOpen, setNutritionInitSheetOpen] = useState(false);
  const [nutritionInitPayload, setNutritionInitPayload] =
    useState<PatientNutritionInitPayload | null>(null);
  const [nutritionInitReadOnly, setNutritionInitReadOnly] = useState(false);
  const [nutritionViewEvolution, setNutritionViewEvolution] =
    useState<PatientTreatmentEvolution | null>(null);
  const [compareSheetOpen, setCompareSheetOpen] = useState(false);
  const [compareEvolutionId, setCompareEvolutionId] = useState<string | null>(
    null,
  );
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<PatientNutritionNote | null>(
    null,
  );
  const [emitDialogOpen, setEmitDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signatureRequesting, setSignatureRequesting] = useState(false);
  const [creditsInsufficientOpen, setCreditsInsufficientOpen] = useState(false);
  const [activeSignature, setActiveSignature] = useState<ElectronicSignature | null>(null);
  const [issuedDialogOpen, setIssuedDialogOpen] = useState(false);
  const [selectedSignEvolutionIds, setSelectedSignEvolutionIds] = useState<string[]>([]);
  const [addEvolutionSheetOpen, setAddEvolutionSheetOpen] = useState(false);
  const [evolutionToEdit, setEvolutionToEdit] = useState<PatientTreatmentEvolution | null>(null);
  const [pdfSheetOpen, setPdfSheetOpen] = useState(false);
  const [pdfSheetMode, setPdfSheetMode] =
    useState<PatientTreatmentEvolutionPdfSheetMode>('view');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [evolutionToDelete, setEvolutionToDelete] = useState<PatientTreatmentEvolution | null>(
    null,
  );
  const [evolutionHistoryTarget, setEvolutionHistoryTarget] =
    useState<PatientTreatmentEvolution | null>(null);
  const pendingSignatureSyncRef = useRef('');

  const treatmentsQuery = usePatientTreatmentsQuery(patientId);
  const evolutionsQuery = usePatientEvolutionsQuery(patientId);
  const nutritionInitiationsQuery = usePatientNutritionInitiationsQuery(
    patientId,
    showNutritionInitializeFlow,
  );
  const {
    createMutation: createTreatmentMutation,
    updateMutation: updateTreatmentMutation,
    deleteMutation: deleteTreatmentMutation,
    reorderMutation,
    finalizeMutation,
    nutritionInitMutation,
  } = usePatientTreatmentMutations(patientId);
  const {
    createMutation: createEvolutionMutation,
    updateMutation: updateEvolutionMutation,
    deleteMutation: deleteEvolutionMutation,
  } = usePatientEvolutionMutations(patientId);

  const unorderedTreatments = treatmentsQuery.data ?? [];

  const allTreatments = useMemo(
    () => applyPatientTreatmentOrder(unorderedTreatments, treatmentOrder),
    [treatmentOrder, unorderedTreatments],
  );

  const sortedEvolutions = useMemo(
    () => sortEvolutionsByDateDesc(evolutionsQuery.data ?? []),
    [evolutionsQuery.data],
  );

  const nutritionMeta = useMemo(
    () =>
      indexNutritionInitiationsByEvolution(nutritionInitiationsQuery.data ?? []),
    [nutritionInitiationsQuery.data],
  );

  // Inicializar é uma vez por tratamento: quem já tem pacote salvo perde o botão.
  const initializedTreatmentIds = useMemo(
    () =>
      new Set(
        (nutritionInitiationsQuery.data ?? []).map((item) => item.treatmentId),
      ),
    [nutritionInitiationsQuery.data],
  );

  const compareAttendances = useMemo(
    () =>
      (nutritionInitiationsQuery.data ?? []).map((item) => {
        const treatment = allTreatments.find(
          (candidate) => candidate.id === item.treatmentId,
        );

        return {
          evolutionId: item.evolutionId,
          initiatedAt: item.initiatedAt,
          treatmentName: treatment
            ? formatPatientTreatmentLabel(treatment)
            : 'Atendimento nutricional',
          professionalName: item.professionalName,
        };
      }),
    [allTreatments, nutritionInitiationsQuery.data],
  );

  // O sheet guarda um snapshot da evolução; a versão da lista traz o status de
  // assinatura já reconciliado com a ZapSign.
  const nutritionViewEvolutionLive = useMemo(() => {
    if (!nutritionViewEvolution) return null;
    return (
      sortedEvolutions.find(
        (evolution) => evolution.id === nutritionViewEvolution.id,
      ) ?? nutritionViewEvolution
    );
  }, [nutritionViewEvolution, sortedEvolutions]);

  const nutritionNotesQuery = usePatientNutritionNotesQuery(
    patientId,
    nutritionViewEvolution?.id ?? null,
  );
  const { saveNote: saveNutritionNote } =
    usePatientNutritionNoteMutations(patientId);

  const handleSaveNutritionNote = useCallback(
    async ({ content, file }: { content: string; file: File | null }) => {
      if (!nutritionViewEvolution) return;

      try {
        await saveNutritionNote.mutateAsync({
          evolutionId: nutritionViewEvolution.id,
          noteId: noteToEdit?.id,
          content,
          file,
        });
        setNoteDialogOpen(false);
        setNoteToEdit(null);
        toast.success(noteToEdit ? 'Nota atualizada.' : 'Nota adicionada.');
      } catch (error) {
        toast.error(getPatientTreatmentMutationErrorMessage(error));
      }
    },
    [noteToEdit, nutritionViewEvolution, saveNutritionNote],
  );

  const handleReorderTreatments = useCallback(
    (reorderedTreatments: PatientTreatment[]) => {
      const allTreatmentIds = unorderedTreatments.map((treatment) => treatment.id);
      const reorderedIds = reorderedTreatments.map((treatment) => treatment.id);

      setTreatmentOrder((current) =>
        mergeReorderedPatientTreatmentIds(current, allTreatmentIds, reorderedIds),
      );

      void reorderMutation.mutateAsync(reorderedIds).catch((error) => {
        toast.error(getPatientTreatmentMutationErrorMessage(error));
      });
    },
    [reorderMutation, unorderedTreatments],
  );

  const handleAddStandalone = useCallback(
    async (
      draft: PatientStandaloneTreatmentDraft,
      professionalName: string,
      locationUiType?: ClinicPlanLocationUiType,
    ) => {
      try {
        const created = await createTreatmentMutation.mutateAsync({
          draft,
          professionalName,
          locationUiType,
        });

        setTreatmentOrder((currentOrder) => {
          const newIds = created.map((treatment) => treatment.id);
          const baseOrder =
            currentOrder.length > 0
              ? currentOrder
              : unorderedTreatments.map((treatment) => treatment.id);

          return [...baseOrder, ...newIds];
        });

        toast.success(
          created.length === 1
            ? 'Procedimento avulso adicionado.'
            : `${created.length} procedimentos avulsos adicionados.`,
        );
      } catch (error) {
        toast.error(getPatientTreatmentMutationErrorMessage(error));
      }
    },
    [createTreatmentMutation, unorderedTreatments],
  );

  const handleOpenFinalizeSheet = useCallback((treatment: PatientTreatment) => {
    if (treatment.status === 'finalized') {
      return;
    }

    if (showNutritionInitializeFlow) {
      setTreatmentToNutritionInit(treatment);
      setNutritionInitPayload(null);
      setNutritionInitReadOnly(false);
      setNutritionViewEvolution(null);
      setNutritionInitSheetOpen(true);
      return;
    }

    setTreatmentsToFinalize([treatment]);
    setFinalizeSheetOpen(true);
  }, [showNutritionInitializeFlow]);

  const handleOpenFinalizeSelected = useCallback((selected: PatientTreatment[]) => {
    const active = selected.filter((treatment) => treatment.status !== 'finalized');
    if (active.length === 0 || showNutritionInitializeFlow) {
      return;
    }

    setTreatmentsToFinalize(active);
    setFinalizeSheetOpen(true);
  }, [showNutritionInitializeFlow]);

  const handleConfirmFinalize = useCallback(
    async (payload: PatientTreatmentFinalizePayload) => {
      try {
        await finalizeMutation.mutateAsync(payload);
        toast.success(
          payload.treatmentIds.length === 1
            ? 'Procedimento finalizado.'
            : `${payload.treatmentIds.length} procedimentos finalizados.`,
        );
        setTreatmentsToFinalize([]);
      } catch (error) {
        toast.error(getPatientTreatmentMutationErrorMessage(error));
        throw error;
      }
    },
    [finalizeMutation],
  );

  const handleConfirmNutritionInit = useCallback(
    async (payload: PatientNutritionInitPayload) => {
      try {
        await nutritionInitMutation.mutateAsync(payload);
        toast.success('Inicialização nutricional salva na evolução.');
        setTreatmentToNutritionInit(null);
        setNutritionInitPayload(null);
        setNutritionInitSheetOpen(false);
      } catch (error) {
        toast.error(getPatientTreatmentMutationErrorMessage(error));
        throw error;
      }
    },
    [nutritionInitMutation],
  );

  const handleTreatmentAction = useCallback(
    (treatment: PatientTreatment, action: PatientTreatmentAction) => {
      const label = formatPatientTreatmentLabel(treatment);

      switch (action) {
        case 'view':
          setTreatmentToView(treatment);
          return;
        case 'view-debit': {
          const budgetItemId = treatment.treatmentItemId?.trim();
          if (!budgetItemId) {
            toast.info(
              `Não há débito vinculado ao procedimento "${label}".`,
            );
            return;
          }
          router.push(
            `${patientDetailTabHref(patientId, 'financeiro')}?budgetItemId=${encodeURIComponent(budgetItemId)}`,
          );
          return;
        }
        case 'edit':
          setTreatmentToEdit(treatment);
          return;
        case 'delete':
          setTreatmentToDelete(treatment);
          return;
        default:
          return;
      }
    },
    [patientId, router],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!treatmentToDelete) {
      return;
    }

    try {
      await deleteTreatmentMutation.mutateAsync(treatmentToDelete.id);
      setTreatmentOrder((current) => current.filter((id) => id !== treatmentToDelete.id));
      toast.success('Procedimento excluído.');
      setTreatmentToDelete(null);
    } catch (error) {
      toast.error(getPatientTreatmentMutationErrorMessage(error));
    }
  }, [deleteTreatmentMutation, treatmentToDelete]);

  const handleSaveTreatmentEdit = useCallback(
    async (treatmentId: string, values: PatientTreatmentEditFormValues) => {
      try {
        await updateTreatmentMutation.mutateAsync({ treatmentId, values });
        toast.success('Procedimento atualizado.');
        setTreatmentToEdit(null);
      } catch (error) {
        toast.error(getPatientTreatmentMutationErrorMessage(error));
      }
    },
    [updateTreatmentMutation],
  );

  const invalidateEvolutions = useCallback(async () => {
    if (!storeId) return;
    await queryClient.invalidateQueries({
      queryKey: evolutionKeys.all(storeId, patientId),
    });
  }, [patientId, queryClient, storeId]);

  /**
   * PDF de um conjunto de evoluções — emissão e assinatura usam o mesmo
   * documento. Atendimentos nutricionais saem com todo o conteúdo cadastrado;
   * odonto e fisio seguem no documento genérico de evolução.
   */
  const buildEvolutionsPdfBlob = useCallback(
    async (selectedEvolutions: PatientTreatmentEvolution[]) => {
      if (!storeId) {
        throw new Error('store not selected');
      }

      const clinicProfile = await getClinicProfile(storeId);
      const clinic = mapClinicSettingsToEvolutionPdfClinic(clinicProfile);
      const onlyNutritionAttendances = selectedEvolutions.every(
        (evolution) => evolution.apiSource === 'nutrition_init',
      );

      if (!onlyNutritionAttendances) {
        return buildPatientEvolutionPdf({
          patientName,
          patientPhone,
          patientBirthDate,
          evolutions: selectedEvolutions,
          clinic,
        });
      }

      const attendances = await Promise.all(
        selectedEvolutions.map(async (evolution) => {
          const [initiation, notes] = await Promise.all([
            getPatientNutritionInitiation(storeId, patientId, evolution.id),
            listPatientNutritionNotes(storeId, patientId, evolution.id),
          ]);
          const treatment = allTreatments.find(
            (item) => item.id === initiation.treatmentId,
          );

          return {
            treatmentName: treatment
              ? formatPatientTreatmentLabel(treatment)
              : evolution.description,
            payload: {
              treatmentId: initiation.treatmentId,
              professionalId: initiation.professionalId ?? '',
              professionalName: initiation.professionalName,
              initiatedAt: initiation.initiatedAt,
              anamnesis: initiation.anamnesis,
              body: initiation.body,
              treatmentPlan: initiation.treatmentPlan,
            },
            notes,
          };
        }),
      );

      return buildPatientNutritionEvolutionsPdf({
        patientName,
        patientPhone,
        patientBirthDate,
        patientGender,
        clinic,
        attendances,
      });
    },
    [
      allTreatments,
      patientBirthDate,
      patientGender,
      patientId,
      patientName,
      patientPhone,
      storeId,
    ],
  );

  const handleEmitEvolutions = useCallback(
    async (selectedIds: string[]) => {
      const selectedEvolutions = filterEvolutionsByIds(sortedEvolutions, selectedIds);
      if (selectedEvolutions.length === 0 || !storeId) {
        return;
      }

      try {
        const blob = await buildEvolutionsPdfBlob(selectedEvolutions);

        setSelectedSignEvolutionIds([]);
        setPdfSheetMode('view');
        setPdfBlob(blob);
        setPdfSheetOpen(true);
      } catch {
        toast.error('Não foi possível gerar o PDF da evolução.');
      }
    },
    [buildEvolutionsPdfBlob, sortedEvolutions, storeId],
  );

  const openIssuedDialog = useCallback((signature: ElectronicSignature) => {
    setActiveSignature(signature);
    setIssuedDialogOpen(true);
  }, []);

  /** Sync ZapSign → evolution.signatureStatus e atualiza a lista quando assinado. */
  const loadEvolutionSignature = useCallback(
    async (evolutionId: string, options?: { sync?: boolean }) => {
      if (!storeId) return null;
      const signature = await getElectronicSignatureByTarget(
        storeId,
        patientId,
        'evolution_batch',
        evolutionId,
        { sync: options?.sync === true },
      );
      setActiveSignature(signature);
      if (
        signature.status === 'signed' ||
        signature.signers.every((signer) => signer.status === 'signed')
      ) {
        await invalidateEvolutions();
      }
      return signature;
    },
    [invalidateEvolutions, patientId, storeId],
  );

  // Poll enquanto o modal de assinatura pendente está aberto (webhook local pode não chegar).
  useEffect(() => {
    if (!issuedDialogOpen || !activeSignature || activeSignature.status !== 'pending') {
      return;
    }

    const evolutionId =
      activeSignature.targetIds?.[0] ?? activeSignature.targetId ?? null;
    if (!evolutionId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadEvolutionSignature(evolutionId, { sync: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeSignature, issuedDialogOpen, loadEvolutionSignature]);

  // Ao carregar a lista, reconcilia evoluções ainda "pending" com a ZapSign (1× por lote).
  useEffect(() => {
    if (!storeId) return;

    const pendingByBatch = new Map<string, string>();
    for (const evolution of sortedEvolutions) {
      if (evolution.signatureStatus !== 'pending') continue;
      const batchKey = evolution.signatureRequestId ?? evolution.id;
      if (!pendingByBatch.has(batchKey)) {
        pendingByBatch.set(batchKey, evolution.id);
      }
    }

    const syncIds = [...pendingByBatch.values()].sort();
    const pendingKey = syncIds.join(',');
    if (!pendingKey || pendingKey === pendingSignatureSyncRef.current) return;
    pendingSignatureSyncRef.current = pendingKey;

    let cancelled = false;
    void (async () => {
      let anySigned = false;
      for (const evolutionId of syncIds) {
        try {
          const signature = await getElectronicSignatureByTarget(
            storeId,
            patientId,
            'evolution_batch',
            evolutionId,
            { sync: true },
          );
          if (
            signature.status === 'signed' ||
            signature.signers.every((signer) => signer.status === 'signed')
          ) {
            anySigned = true;
          }
        } catch {
          // Ignora falha pontual — poll do modal força sync sob demanda.
        }
      }
      if (cancelled) return;
      if (anySigned) {
        pendingSignatureSyncRef.current = '';
        await invalidateEvolutions();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [invalidateEvolutions, patientId, sortedEvolutions, storeId]);

  const handlePrepareSignEvolutions = useCallback(
    async (selectedIds: string[]) => {
      if (!storeId) {
        return;
      }

      // A API recusa o lote inteiro se qualquer evolução já tiver assinatura.
      const selectedEvolutions = filterEvolutionsByIds(
        sortedEvolutions,
        selectedIds,
      ).filter((evolution) => evolution.signatureStatus === 'unsigned');
      if (selectedEvolutions.length === 0) {
        toast.error(
          'A evolução selecionada já possui assinatura pendente ou concluída.',
        );
        return;
      }

      if (await isSignatureCreditBalanceEmpty(storeId)) {
        setCreditsInsufficientOpen(true);
        return;
      }

      try {
        const blob = await buildEvolutionsPdfBlob(selectedEvolutions);

        setSelectedSignEvolutionIds(
          selectedEvolutions.map((evolution) => evolution.id),
        );
        setPdfSheetMode('request-signature');
        setPdfBlob(blob);
        setPdfSheetOpen(true);
      } catch {
        toast.error('Não foi possível gerar o PDF da evolução.');
        throw new Error('PDF generation failed');
      }
    },
    [buildEvolutionsPdfBlob, sortedEvolutions, storeId],
  );

  /** Rodapé do atendimento nutricional já assinado (ou pendente): abre a assinatura. */
  const handleViewNutritionSignature = useCallback(async () => {
    const evolution = nutritionViewEvolutionLive;
    if (!evolution) return;

    setNutritionInitSheetOpen(false);
    try {
      const signature = await loadEvolutionSignature(evolution.id, {
        sync: true,
      });
      if (!signature) return;
      setIssuedDialogOpen(true);
    } catch {
      toast.error('Não foi possível carregar a assinatura deste atendimento.');
    }
  }, [loadEvolutionSignature, nutritionViewEvolutionLive]);

  const executeSignatureRequest = useCallback(async () => {
    if (!storeId || selectedSignEvolutionIds.length === 0 || !pdfBlob) {
      return;
    }

    setSignatureRequesting(true);
    try {
      if (await isSignatureCreditBalanceEmpty(storeId)) {
        setCreditsInsufficientOpen(true);
        return;
      }

      const fileBase64 = await blobToBase64(pdfBlob);
      const signature = await requestEvolutionBatchSignature(storeId, patientId, {
        evolutionIds: selectedSignEvolutionIds,
        fileBase64,
      });
      invalidateSignatureCredits(queryClient, storeId);
      await invalidateEvolutions();
      setPdfSheetOpen(false);
      setPdfBlob(null);
      setPdfSheetMode('view');
      setSelectedSignEvolutionIds([]);
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
          : 'Não foi possível solicitar a assinatura das evoluções.',
      );
    } finally {
      setSignatureRequesting(false);
    }
  }, [
    invalidateEvolutions,
    openIssuedDialog,
    patientId,
    pdfBlob,
    queryClient,
    selectedSignEvolutionIds,
    storeId,
  ]);

  const handleRequestSignatureClick = useCallback(() => {
    if (!storeId) {
      toast.error('Loja não selecionada.');
      return;
    }

    void executeSignatureRequest();
  }, [executeSignatureRequest, storeId]);

  const handleSaveStandaloneEvolution = useCallback(
    async (payload: PatientStandaloneEvolutionPayload) => {
      try {
        await createEvolutionMutation.mutateAsync(payload);
        toast.success('Evolução adicionada.');
      } catch (error) {
        toast.error(getPatientEvolutionMutationErrorMessage(error));
        throw error;
      }
    },
    [createEvolutionMutation],
  );

  const handleUpdateEvolution = useCallback(
    async (evolutionId: string, payload: PatientStandaloneEvolutionPayload) => {
      try {
        await updateEvolutionMutation.mutateAsync({ evolutionId, payload });
        toast.success('Evolução atualizada.');
      } catch (error) {
        toast.error(getPatientEvolutionMutationErrorMessage(error));
        throw error;
      }
    },
    [updateEvolutionMutation],
  );

  const handleOpenAddEvolutionSheet = useCallback(() => {
    setEvolutionToEdit(null);
    setAddEvolutionSheetOpen(true);
  }, []);

  const openNutritionInitSheet = useCallback(
    (evolution: PatientTreatmentEvolution, readOnly: boolean) => {
      if (!storeId) {
        toast.error('Loja não selecionada.');
        return;
      }

      void (async () => {
        try {
          const initiation = await getPatientNutritionInitiation(
            storeId,
            patientId,
            evolution.id,
          );
          const treatment =
            allTreatments.find((item) => item.id === initiation.treatmentId) ??
            ({
              id: initiation.treatmentId,
              patientId,
              source: 'budget',
              status: 'active',
              description: evolution.description,
              valueCents: evolution.valueCents,
              professionalId: initiation.professionalId ?? undefined,
              professionalName: initiation.professionalName,
            } satisfies PatientTreatment);

          setTreatmentToNutritionInit(treatment);
          setNutritionInitPayload({
            treatmentId: initiation.treatmentId,
            professionalId: initiation.professionalId ?? '',
            professionalName: initiation.professionalName,
            initiatedAt: initiation.initiatedAt,
            anamnesis: initiation.anamnesis,
            body: initiation.body,
            treatmentPlan: initiation.treatmentPlan,
          });
          setNutritionInitReadOnly(readOnly);
          setNutritionViewEvolution(readOnly ? evolution : null);
          setNutritionInitSheetOpen(true);
        } catch (error) {
          toast.error(getPatientTreatmentMutationErrorMessage(error));
        }
      })();
    },
    [allTreatments, patientId, storeId],
  );

  const handleViewNutritionEvolution = useCallback(
    (evolution: PatientTreatmentEvolution) => {
      openNutritionInitSheet(evolution, true);
    },
    [openNutritionInitSheet],
  );

  const handleOpenEditEvolutionSheet = useCallback(
    (evolution: PatientTreatmentEvolution) => {
      if (evolution.apiSource === 'nutrition_init') {
        openNutritionInitSheet(evolution, false);
        return;
      }

      setEvolutionToEdit(evolution);
      setAddEvolutionSheetOpen(true);
    },
    [openNutritionInitSheet],
  );

  const handleEvolutionAction = useCallback(
    (evolution: PatientTreatmentEvolution, action: PatientTreatmentEvolutionAction) => {
      switch (action) {
        case 'download-document': {
          if (!storeId) {
            return;
          }

          void (async () => {
            try {
              // Assinada: o documento da ZapSign é o mesmo PDF enviado para
              // assinatura, já com as assinaturas — vale mais que reconstruir.
              if (
                evolution.signatureStatus === 'signed' &&
                evolution.signatureRequestId
              ) {
                try {
                  const blob = await fetchSignedPdfBlob(
                    storeId,
                    patientId,
                    evolution.signatureRequestId,
                  );
                  downloadPatientEvolutionPdf(
                    blob,
                    buildPatientEvolutionPdfFileName(patientName),
                  );
                  return;
                } catch {
                  toast.error(
                    'Não foi possível baixar o documento assinado. Gerando o PDF do atendimento.',
                  );
                }
              }

              const clinicProfile = await getClinicProfile(storeId);
              if (evolution.apiSource === 'nutrition_init') {
                const initiation = await getPatientNutritionInitiation(
                  storeId,
                  patientId,
                  evolution.id,
                );
                const notes = await listPatientNutritionNotes(
                  storeId,
                  patientId,
                  evolution.id,
                );
                const treatment = allTreatments.find(
                  (item) => item.id === initiation.treatmentId,
                );
                const payload: PatientNutritionInitPayload = {
                  treatmentId: initiation.treatmentId,
                  professionalId: initiation.professionalId ?? '',
                  professionalName: initiation.professionalName,
                  initiatedAt: initiation.initiatedAt,
                  anamnesis: initiation.anamnesis,
                  body: initiation.body,
                  treatmentPlan: initiation.treatmentPlan,
                };
                const blob = await buildPatientNutritionPdf({
                  patientName,
                  patientPhone,
                  patientBirthDate,
                  patientGender,
                  treatmentName: treatment
                    ? formatPatientTreatmentLabel(treatment)
                    : evolution.description,
                  payload,
                  notes,
                  clinic: mapClinicSettingsToEvolutionPdfClinic(clinicProfile),
                });
                downloadPatientEvolutionPdf(
                  blob,
                  buildPatientEvolutionPdfFileName(patientName),
                );
                return;
              }

              const blob = await buildPatientEvolutionPdf({
                patientName,
                patientPhone,
                patientBirthDate,
                evolutions: [evolution],
                clinic: mapClinicSettingsToEvolutionPdfClinic(clinicProfile),
              });
              downloadPatientEvolutionPdf(blob, buildPatientEvolutionPdfFileName(patientName));
            } catch {
              toast.error('Não foi possível gerar o PDF da evolução.');
            }
          })();
          return;
        }
        case 'action-history':
          setEvolutionHistoryTarget(evolution);
          return;
        case 'edit':
          handleOpenEditEvolutionSheet(evolution);
          return;
        case 'delete':
          setEvolutionToDelete(evolution);
          return;
        default:
          return;
      }
    },
    [
      allTreatments,
      handleOpenEditEvolutionSheet,
      patientBirthDate,
      patientGender,
      patientId,
      patientName,
      patientPhone,
      storeId,
    ],
  );

  const handleConfirmDeleteEvolution = useCallback(async () => {
    if (!evolutionToDelete) {
      return;
    }

    try {
      await deleteEvolutionMutation.mutateAsync(evolutionToDelete.id);
      toast.success('Evolução excluída.');
      setEvolutionToDelete(null);
    } catch (error) {
      toast.error(getPatientEvolutionMutationErrorMessage(error));
    }
  }, [deleteEvolutionMutation, evolutionToDelete]);

  const isLoading = treatmentsQuery.isLoading;
  const isError = treatmentsQuery.isError;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando procedimentos…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar os procedimentos. Tente novamente.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <PatientTreatmentAddForm
          patientId={patientId}
          disabled={createTreatmentMutation.isPending}
          onAddStandalone={handleAddStandalone}
        />

        {showToothMap ? (
          <PatientTreatmentsOdontogramCard
            patientId={patientId}
            treatments={allTreatments}
          />
        ) : null}

        {showBodyMap ? (
          <PatientTreatmentsCorpogramCard
            patientId={patientId}
            treatments={allTreatments}
            defaultPatientGender={patientGender}
          />
        ) : null}

        <PatientBudgetTreatmentsPanel
          className="min-w-0 flex-1"
          treatments={allTreatments}
          primaryActionLabel={
            showNutritionInitializeFlow ? 'Inicializar' : 'Finalizar'
          }
          concludedTreatmentIds={
            showNutritionInitializeFlow ? initializedTreatmentIds : undefined
          }
          selectionEnabled={!showNutritionInitializeFlow}
          onFinalize={handleOpenFinalizeSheet}
          onFinalizeSelected={handleOpenFinalizeSelected}
          onTreatmentAction={handleTreatmentAction}
          onReorder={handleReorderTreatments}
        />
      </div>

      <PatientTreatmentEvolutionPanel
        className="w-full min-w-0"
        evolutions={sortedEvolutions}
        nutritionMeta={nutritionMeta}
        onViewNutrition={handleViewNutritionEvolution}
        onEmitEvolution={() => setEmitDialogOpen(true)}
        onSignEvolution={() => setSignDialogOpen(true)}
        onAddEvolution={handleOpenAddEvolutionSheet}
        onEvolutionAction={handleEvolutionAction}
      />

      <PatientTreatmentEmitEvolutionDialog
        open={emitDialogOpen}
        onOpenChange={setEmitDialogOpen}
        patientName={patientName}
        evolutions={sortedEvolutions}
        onEmit={handleEmitEvolutions}
      />

      <PatientTreatmentSignEvolutionDialog
        open={signDialogOpen}
        onOpenChange={setSignDialogOpen}
        patientName={patientName}
        evolutions={sortedEvolutions}
        onConfirm={handlePrepareSignEvolutions}
      />

      {storeId ? (
        <PatientSignatureIssuedDialog
          open={issuedDialogOpen}
          onOpenChange={(open) => {
            setIssuedDialogOpen(open);
            if (!open) setActiveSignature(null);
          }}
          storeId={storeId}
          signature={activeSignature}
        />
      ) : null}

      <PatientTreatmentEvolutionPdfSheet
        open={pdfSheetOpen}
        onOpenChange={(open) => {
          setPdfSheetOpen(open);
          if (!open) {
            setPdfBlob(null);
            setPdfSheetMode('view');
            if (pdfSheetMode === 'request-signature') {
              setSelectedSignEvolutionIds([]);
            }
          }
        }}
        patientName={patientName}
        pdfBlob={pdfBlob}
        mode={pdfSheetMode}
        onRequestSignature={handleRequestSignatureClick}
        isRequestingSignature={signatureRequesting}
      />

      <PatientTreatmentAddEvolutionSheet
        open={addEvolutionSheetOpen}
        evolution={evolutionToEdit}
        onOpenChange={(open) => {
          setAddEvolutionSheetOpen(open);
          if (!open) {
            setEvolutionToEdit(null);
          }
        }}
        onSave={handleSaveStandaloneEvolution}
        onUpdate={handleUpdateEvolution}
      />

      <PatientTreatmentEvolutionActionHistoryDialog
        open={evolutionHistoryTarget !== null}
        evolution={evolutionHistoryTarget}
        patientId={patientId}
        onOpenChange={(open) => {
          if (!open) {
            setEvolutionHistoryTarget(null);
          }
        }}
      />

      <PatientTreatmentFinalizeSheet
        open={finalizeSheetOpen}
        treatments={treatmentsToFinalize}
        isSubmitting={finalizeMutation.isPending}
        onOpenChange={(open) => {
          setFinalizeSheetOpen(open);
          if (!open) {
            setTreatmentsToFinalize([]);
          }
        }}
        onFinalize={handleConfirmFinalize}
      />

      <PatientNutritionInitSheet
        open={nutritionInitSheetOpen}
        treatment={treatmentToNutritionInit}
        patientGender={patientGender}
        patientBirthDate={patientBirthDate}
        isSubmitting={nutritionInitMutation.isPending}
        readOnly={nutritionInitReadOnly}
        initialPayload={nutritionInitPayload}
        notes={nutritionNotesQuery.data ?? []}
        onOpenChange={(open) => {
          setNutritionInitSheetOpen(open);
          if (!open) {
            setTreatmentToNutritionInit(null);
            setNutritionInitPayload(null);
            setNutritionInitReadOnly(false);
            setNutritionViewEvolution(null);
          }
        }}
        onSave={handleConfirmNutritionInit}
        onAddNote={() => {
          setNoteToEdit(null);
          setNoteDialogOpen(true);
        }}
        onEditNote={(note) => {
          setNoteToEdit(note);
          setNoteDialogOpen(true);
        }}
        signatureStatus={nutritionViewEvolutionLive?.signatureStatus}
        onDownloadPdf={() => {
          if (nutritionViewEvolutionLive) {
            handleEvolutionAction(
              nutritionViewEvolutionLive,
              'download-document',
            );
          }
        }}
        onSignAttendance={() => {
          if (!nutritionViewEvolutionLive) return;
          if (nutritionViewEvolutionLive.signatureStatus !== 'unsigned') {
            void handleViewNutritionSignature();
            return;
          }
          setNutritionInitSheetOpen(false);
          void handlePrepareSignEvolutions([
            nutritionViewEvolutionLive.id,
          ]).catch(() => undefined);
        }}
        onViewSignature={() => {
          void handleViewNutritionSignature();
        }}
        onCompare={() => {
          setCompareEvolutionId(nutritionViewEvolution?.id ?? null);
          setNutritionInitSheetOpen(false);
          setCompareSheetOpen(true);
        }}
      />

      <PatientNutritionCompareSheet
        open={compareSheetOpen}
        patientId={patientId}
        patientGender={patientGender}
        attendances={compareAttendances}
        defaultEvolutionId={compareEvolutionId}
        onOpenChange={(open) => {
          setCompareSheetOpen(open);
          if (!open) {
            setCompareEvolutionId(null);
          }
        }}
      />

      <PatientNutritionNoteDialog
        open={noteDialogOpen}
        note={noteToEdit}
        isSaving={saveNutritionNote.isPending}
        onOpenChange={(open) => {
          setNoteDialogOpen(open);
          if (!open) {
            setNoteToEdit(null);
          }
        }}
        onSave={handleSaveNutritionNote}
      />

      <PatientTreatmentEditDialog
        treatment={treatmentToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setTreatmentToEdit(null);
          }
        }}
        onSave={handleSaveTreatmentEdit}
      />

      <PatientTreatmentViewDialog
        treatment={treatmentToView}
        onOpenChange={(open) => {
          if (!open) {
            setTreatmentToView(null);
          }
        }}
      />

      <ConfirmDialog
        open={treatmentToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteTreatmentMutation.isPending) {
            setTreatmentToDelete(null);
          }
        }}
        title="Excluir procedimento"
        icon={null}
        description={
          treatmentToDelete
            ? treatmentToDelete.status === 'finalized'
              ? 'Este procedimento, as receitas e os serviços vinculados, serão excluídos permanentemente da sua clínica.'
              : `Tem certeza que deseja excluir o procedimento "${formatPatientTreatmentLabel(treatmentToDelete)}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={deleteTreatmentMutation.isPending}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={evolutionToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteEvolutionMutation.isPending) {
            setEvolutionToDelete(null);
          }
        }}
        title="Excluir evolução"
        description={
          evolutionToDelete
            ? `Tem certeza que deseja excluir a evolução "${evolutionToDelete.description}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={deleteEvolutionMutation.isPending}
        onConfirm={handleConfirmDeleteEvolution}
      />

      <SignatureCreditsInsufficientDialog
        open={creditsInsufficientOpen}
        onOpenChange={setCreditsInsufficientOpen}
      />
    </div>
  );
}
