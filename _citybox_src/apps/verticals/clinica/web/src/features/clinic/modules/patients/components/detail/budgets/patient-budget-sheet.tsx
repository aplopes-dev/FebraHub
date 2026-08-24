'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import { useTeamMembers } from '@/features/shared/team';
import { useStore } from '@/lib/store-context';
import { storeShowsBodyMap, storeShowsToothMap, storeShowsBudgetTreatmentSessions } from '@/lib/clinic-strand';
import { PlanBrlCurrencyInput } from '@/features/clinic/modules/settings/plans/components/plan-brl-currency-input';
import { EMPTY_BRL_CURRENCY } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import {
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import {
  createEmptyPatientBudgetRejection,
  getPatientBudgetSheetState,
  isPatientBudgetSheetDirty,
  serializePatientBudgetSheetSnapshot,
} from '../../../lib/patient-budget-mapper';
import { expandBudgetTreatmentsBySessions } from '../../../lib/expand-budget-treatments-by-sessions';
import { usePatientPlanOptions } from '../../../lib/use-patient-plan-options';
import { usePatientPlanTreatments } from '../../../lib/use-patient-plan-treatments';
import {
  calculatePatientBudgetFinalCents,
  calculateInstallmentAmountCents,
  calculateInstallmentBalanceCents,
  formatCentsToBrlInput,
  buildDefaultPatientBudgetDescription,
  parseBrlCurrencyToCents,
  parsePositiveInteger,
  sumPatientBudgetTreatmentCents,
} from '../../../lib/patient-budget-form-utils';
import {
  isOdontogramRegionLabel,
} from '../../../lib/odontogram-regions';
import { parsePatientBudgetToothRegionSelectValue, hofRegionIdsToSelectLabels } from '../../../lib/patient-budget-tooth-numbers';
import type {
  PatientBudgetDiscount,
  PatientBudgetFormValues,
  PatientBudgetInstallment,
  PatientBudgetPrintSettings,
  PatientBudgetRejectionDraft,
  PatientBudgetSheetSubmitPayload,
  PatientBudgetStatusSelection,
  PatientBudgetTreatmentDraft,
  PatientBudgetTreatmentItem,
} from '../../../types/patient-budget-form';
import {
  DEFAULT_PATIENT_BUDGET_PRINT_SETTINGS,
  EMPTY_PATIENT_BUDGET_FORM_VALUES,
  EMPTY_PATIENT_BUDGET_INSTALLMENT,
  EMPTY_PATIENT_BUDGET_TREATMENT_DRAFT,
} from '../../../types/patient-budget-form';
import { PatientBudgetApproveDialog } from './patient-budget-approve-dialog';
import type { PatientBudgetApproveConfirmInput } from './patient-budget-approve-dialog';
import { PatientBudgetOdontogramAccordion } from './odontogram/patient-budget-odontogram-accordion';
import { PatientBudgetCorpogramAccordion } from './corpogram/patient-budget-corpogram-accordion';
import {
  formatBodyRegionLocationLabel,
  parseBodyRegionIdFromLabel,
} from '@/lib/body-region-location';
import { formatToothLocationLabel } from './odontogram/patient-budget-odontogram';
import { parseToothLocationLabel } from '../../../lib/tooth-location-label';
import { HOF_REGIONS, resolveHofRegionIdAlias, type FaceLetter } from './odontogram/odontogram-data';
import type { OdontogramTab } from './odontogram/odontogram-data';
import { PatientBudgetToothRegionSelect } from './patient-budget-tooth-region-select';
import { PatientBudgetBodyRegionSelect } from './patient-budget-body-region-select';
import {
  budgetLocationTypeFromUiType,
  defaultLocationUiTypeForClinicStrand,
  locationUiTypeRequiresSelection,
  locationUiTypeUsesHofTab,
} from '@/features/clinic/modules/settings/plans/data/specialty-location-ui-type';
import { PatientBudgetTreatmentSelect } from './patient-budget-treatment-select';
import { PatientBudgetTreatmentsTable } from './patient-budget-treatments-table';
import { PatientBudgetSummaryPanel } from './patient-budget-summary-panel';
import type { PatientBudgetTreatmentAction } from './patient-budget-treatment-actions-menu';
import { toPatientReturnAlertIsoDate as toIsoDateOnly } from '../../../lib/compute-patient-return-date';
import type { PatientBudget } from '../../../types/patient-budget';

type PatientBudgetSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientGender?: string | null;
  editingBudget?: PatientBudget | null;
  isSaving?: boolean;
  /** Checkbox Equipe: Aprovar orçamentos. */
  canApproveBudget?: boolean;
  /** Checkbox Equipe: Cadastrar (novo) ou Editar (existente). */
  canSaveBudget?: boolean;
  onSave: (
    payload: PatientBudgetSheetSubmitPayload,
    budgetId?: string,
  ) => Promise<void> | void;
  onApprove: (
    payload: PatientBudgetSheetSubmitPayload,
    budgetId?: string,
  ) => Promise<void> | void;
};

type FormErrors = {
  description?: string;
  responsibleId?: string;
  date?: string;
  treatments?: string;
  draft?: string;
  rejectionReason?: string;
  rejectionDate?: string;
};

function createTreatmentItem(
  draft: PatientBudgetTreatmentDraft,
  toothNumber: number,
  planName: string,
  treatmentName: string,
  professionalName: string,
  id?: string,
): PatientBudgetTreatmentItem {
  const faces = (draft.toothFaces[toothNumber] ?? []) as FaceLetter[];

  return {
    id: id ?? crypto.randomUUID(),
    toothNumber,
    locationType: 'tooth',
    locationLabel: formatToothLocationLabel(toothNumber, faces),
    treatmentId: draft.treatmentId,
    treatmentName,
    professionalId: draft.professionalId,
    professionalName,
    planId: draft.planId,
    planName,
    valueCents: parseBrlCurrencyToCents(draft.value),
  };
}

function createHofTreatmentItem(
  draft: PatientBudgetTreatmentDraft,
  regionId: string,
  planName: string,
  treatmentName: string,
  professionalName: string,
  id?: string,
): PatientBudgetTreatmentItem {
  const region = HOF_REGIONS.find((item) => item.id === regionId);

  return {
    id: id ?? crypto.randomUUID(),
    toothNumber: 0,
    locationType: 'body_region',
    locationLabel: region?.label ?? regionId,
    treatmentId: draft.treatmentId,
    treatmentName,
    professionalId: draft.professionalId,
    professionalName,
    planId: draft.planId,
    planName,
    valueCents: parseBrlCurrencyToCents(draft.value),
  };
}

function createBodyRegionTreatmentItem(
  draft: PatientBudgetTreatmentDraft,
  locationLabel: string,
  planName: string,
  treatmentName: string,
  professionalName: string,
  id?: string,
): PatientBudgetTreatmentItem {
  return {
    id: id ?? crypto.randomUUID(),
    toothNumber: 0,
    locationType: 'body_region',
    locationLabel,
    treatmentId: draft.treatmentId,
    treatmentName,
    professionalId: draft.professionalId,
    professionalName,
    planId: draft.planId,
    planName,
    valueCents: parseBrlCurrencyToCents(draft.value),
  };
}

function createCorpBodyTreatmentItem(
  draft: PatientBudgetTreatmentDraft,
  regionId: string,
  planName: string,
  treatmentName: string,
  professionalName: string,
  id?: string,
): PatientBudgetTreatmentItem {
  return createBodyRegionTreatmentItem(
    draft,
    formatBodyRegionLocationLabel(regionId),
    planName,
    treatmentName,
    professionalName,
    id,
  );
}

function createLocationFreeTreatmentItem(
  draft: PatientBudgetTreatmentDraft,
  locationType: 'session' | 'none',
  planName: string,
  treatmentName: string,
  professionalName: string,
  id?: string,
): PatientBudgetTreatmentItem {
  return {
    id: id ?? crypto.randomUUID(),
    toothNumber: 0,
    locationType,
    locationLabel: '',
    treatmentId: draft.treatmentId,
    treatmentName,
    professionalId: draft.professionalId,
    professionalName,
    planId: draft.planId,
    planName,
    valueCents: parseBrlCurrencyToCents(draft.value),
  };
}

function resolveHofRegionIdFromLabel(locationLabel: string | undefined): string | null {
  if (!locationLabel?.trim()) {
    return null;
  }
  const trimmed = locationLabel.trim();
  const alias = resolveHofRegionIdAlias(trimmed);
  if (alias) return alias;
  const region = HOF_REGIONS.find((item) => item.label === trimmed);
  return region?.id ?? null;
}

export function PatientBudgetSheet({
  open,
  onOpenChange,
  patientName,
  patientGender,
  editingBudget = null,
  isSaving = false,
  canApproveBudget = true,
  canSaveBudget = true,
  onSave,
  onApprove,
}: PatientBudgetSheetProps) {
  const isEditing = editingBudget !== null;
  const isApproved = editingBudget?.status === 'approved';
  const showStatusSelect =
    isEditing && (editingBudget.status === 'draft' || editingBudget.status === 'rejected');
  const { memberId, clinicStrand } = useStore();
  const showToothMap = storeShowsToothMap(clinicStrand);
  const showBodyMap = storeShowsBodyMap(clinicStrand);
  const showBudgetSessions = storeShowsBudgetTreatmentSessions(clinicStrand);
  const { members, isLoading: isMembersLoading } = useTeamMembers();
  const { plans: activePlans, isLoading: isPlansLoading } = usePatientPlanOptions();
  const [formValues, setFormValues] = useState<PatientBudgetFormValues>(EMPTY_PATIENT_BUDGET_FORM_VALUES);
  const [draft, setDraft] = useState<PatientBudgetTreatmentDraft>(EMPTY_PATIENT_BUDGET_TREATMENT_DRAFT);
  const [treatments, setTreatments] = useState<PatientBudgetTreatmentItem[]>([]);
  const [editingTreatmentId, setEditingTreatmentId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDiscount, setShowDiscount] = useState(false);
  const [discount, setDiscount] = useState<PatientBudgetDiscount | null>(null);
  const [installment, setInstallment] = useState<PatientBudgetInstallment>(
    EMPTY_PATIENT_BUDGET_INSTALLMENT,
  );
  const [observations, setObservations] = useState('');
  const [statusSelection, setStatusSelection] = useState<PatientBudgetStatusSelection>('draft');
  const [rejection, setRejection] = useState<PatientBudgetRejectionDraft>(() =>
    createEmptyPatientBudgetRejection(),
  );
  const [emitContractOnApprove, setEmitContractOnApprove] = useState(false);
  const [printSettings, setPrintSettings] = useState<PatientBudgetPrintSettings>({
    ...DEFAULT_PATIENT_BUDGET_PRINT_SETTINGS,
  });
  const [submitIntent, setSubmitIntent] = useState<'save' | 'approve' | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [odontogramTab, setOdontogramTab] = useState<OdontogramTab>('perm');
  const baselineSnapshotRef = useRef<string | null>(null);

  const { treatments: planTreatments } = usePatientPlanTreatments(draft.planId);

  const activeProfessionals = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );

  const selectedPlan = activePlans.find((plan) => plan.id === draft.planId);
  const selectedTreatment = planTreatments.find((item) => item.id === draft.treatmentId);
  const selectedProfessional = activeProfessionals.find(
    (member) => member.id === draft.professionalId,
  );
  const selectedLocationUiType =
    selectedTreatment?.locationUiType ??
    defaultLocationUiTypeForClinicStrand(clinicStrand);
  const requiresLocationSelection = locationUiTypeRequiresSelection(selectedLocationUiType);
  const showToothLocationUi =
    showToothMap &&
    (selectedLocationUiType === 'tooth' || selectedLocationUiType === 'face_region');
  // Em fisio, mantém o mapa anatômico sempre que a seleção de região for necessária
  // (inclui tratamento legado com locationUiType=tooth).
  const showBodyLocationUi =
    showBodyMap &&
    (selectedLocationUiType === 'body_region' ||
      (!showToothMap && locationUiTypeRequiresSelection(selectedLocationUiType)));

  const selectedResponsible = activeProfessionals.find(
    (member) => member.id === formValues.responsibleId,
  );

  const emptyTreatmentDraft = useCallback(
    (): PatientBudgetTreatmentDraft => ({
      ...EMPTY_PATIENT_BUDGET_TREATMENT_DRAFT,
      professionalId: memberId ?? '',
    }),
    [memberId],
  );

  const applyBudgetToForm = useCallback((budget: PatientBudget) => {
    const sheetState = getPatientBudgetSheetState(budget);
    setFormValues(sheetState.formValues);
    setTreatments(sheetState.treatments);
    setDraft(emptyTreatmentDraft());
    setEditingTreatmentId(null);
    setErrors({});
    setObservations(sheetState.observations);
    setInstallment(sheetState.installment);
    setShowDiscount(sheetState.showDiscount);
    setDiscount(sheetState.discount);
    setStatusSelection(sheetState.statusSelection);
    setRejection(sheetState.rejection);
    setEmitContractOnApprove(sheetState.emitContractOnApprove);
    setPrintSettings(sheetState.printSettings);
    setSubmitIntent(null);
    baselineSnapshotRef.current = serializePatientBudgetSheetSnapshot(sheetState);
  }, [emptyTreatmentDraft]);

  const resetForm = useCallback(() => {
    setFormValues({
      ...EMPTY_PATIENT_BUDGET_FORM_VALUES,
      responsibleId: memberId ?? '',
      date: new Date(),
    });
    setDraft(emptyTreatmentDraft());
    setTreatments([]);
    setEditingTreatmentId(null);
    setErrors({});
    setShowDiscount(false);
    setDiscount(null);
    setInstallment(EMPTY_PATIENT_BUDGET_INSTALLMENT);
    setObservations('');
    setStatusSelection('draft');
    setRejection(createEmptyPatientBudgetRejection());
    setEmitContractOnApprove(false);
    setPrintSettings({ ...DEFAULT_PATIENT_BUDGET_PRINT_SETTINGS });
    setSubmitIntent(null);
    baselineSnapshotRef.current = null;
  }, [emptyTreatmentDraft, memberId]);

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    if (editingBudget) {
      applyBudgetToForm(editingBudget);
      return;
    }

    setFormValues({
      description: buildDefaultPatientBudgetDescription(patientName),
      responsibleId: memberId ?? '',
      date: new Date(),
    });
    setDraft({
      ...EMPTY_PATIENT_BUDGET_TREATMENT_DRAFT,
      professionalId: memberId ?? '',
    });
    setTreatments([]);
    setEditingTreatmentId(null);
    setErrors({});
    setShowDiscount(false);
    setDiscount(null);
    setInstallment(EMPTY_PATIENT_BUDGET_INSTALLMENT);
    setObservations('');
    setStatusSelection('draft');
    setRejection(createEmptyPatientBudgetRejection());
    setEmitContractOnApprove(false);
    setPrintSettings({ ...DEFAULT_PATIENT_BUDGET_PRINT_SETTINGS });
    setSubmitIntent(null);
    baselineSnapshotRef.current = null;
    // memberId async: preenchimento residual no efeito abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reabrir/trocar orçamento/paciente
  }, [open, editingBudget, patientName]);

  useEffect(() => {
    if (!open || editingBudget || !memberId) return;

    setFormValues((current) =>
      current.responsibleId ? current : { ...current, responsibleId: memberId },
    );
    setDraft((current) =>
      current.professionalId ? current : { ...current, professionalId: memberId },
    );
  }, [open, editingBudget, memberId]);

  const patchForm = (partial: Partial<PatientBudgetFormValues>) => {
    setFormValues((current) => ({ ...current, ...partial }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(partial) as (keyof PatientBudgetFormValues)[]) {
        if (key === 'description' || key === 'date' || key === 'responsibleId') delete next[key];
      }
      return next;
    });
  };

  const patchDraft = (partial: Partial<PatientBudgetTreatmentDraft>) => {
    setDraft((current) => ({ ...current, ...partial }));
    setErrors((current) => ({ ...current, draft: undefined }));
  };

  const handlePlanChange = (planId: string) => {
    patchDraft({
      planId,
      treatmentId: '',
      value: '',
      toothNumbers: [],
      regionLabels: [],
      hofRegionIds: [],
      toothFaces: {},
      hofAnnotations: null,
    });
  };

  const handleTreatmentChange = (treatmentId: string) => {
    const treatment = planTreatments.find((item) => item.id === treatmentId);
    const acceptsFaces = treatment?.acceptsFaces === true;
    patchDraft({
      treatmentId,
      value: treatment ? formatCentsToBrlInput(treatment.valueCents) : '',
      ...(acceptsFaces ? {} : { toothFaces: {} }),
    });
    if (locationUiTypeUsesHofTab(treatment?.locationUiType ?? 'tooth')) {
      setOdontogramTab('hof');
    } else if (treatment?.locationUiType === 'tooth') {
      setOdontogramTab('perm');
    }
  };

  const toothRegionSelectValue = useMemo(
    () => [
      ...draft.toothNumbers.map(String),
      ...draft.regionLabels,
      ...hofRegionIdsToSelectLabels(draft.hofRegionIds),
    ],
    [draft.toothNumbers, draft.regionLabels, draft.hofRegionIds],
  );

  const handleToothRegionSelectChange = (values: string[]) => {
    const parsed = parsePatientBudgetToothRegionSelectValue(values);
    const selected = new Set(parsed.toothNumbers);
    const nextFaces = Object.fromEntries(
      Object.entries(draft.toothFaces).filter(([tooth]) => selected.has(Number(tooth))),
    );
    patchDraft({
      toothNumbers: parsed.toothNumbers,
      regionLabels: parsed.regionLabels,
      hofRegionIds: parsed.hofRegionIds,
      toothFaces: nextFaces,
    });
  };

  const handleOdontogramTeethChange = (nextTeeth: number[]) => {
    const selected = new Set(nextTeeth);
    const nextFaces = Object.fromEntries(
      Object.entries(draft.toothFaces).filter(([tooth]) => selected.has(Number(tooth))),
    );

    patchDraft({
      toothNumbers: nextTeeth,
      toothFaces: nextFaces,
    });
  };

  const handleBodyRegionToggle = (regionId: string) => {
    const selected = new Set(draft.regionLabels);
    patchDraft({
      regionLabels: selected.has(regionId)
        ? draft.regionLabels.filter((item) => item !== regionId)
        : [...draft.regionLabels, regionId],
    });
  };

  const listedBodyRegionIds = useMemo(
    () =>
      treatments
        .map((item) => parseBodyRegionIdFromLabel(item.locationLabel))
        .filter((id): id is string => Boolean(id)),
    [treatments],
  );

  const validateDraft = (): boolean => {
    const hasToothSelection =
      showToothLocationUi &&
      selectedLocationUiType === 'tooth' &&
      (draft.toothNumbers.length > 0 || draft.regionLabels.length > 0);
    const hasHofSelection =
      showToothLocationUi &&
      selectedLocationUiType === 'face_region' &&
      draft.hofRegionIds.length > 0;
    const hasBodySelection = showBodyLocationUi && draft.regionLabels.length > 0;

    if (
      !draft.planId ||
      !draft.treatmentId ||
      !draft.professionalId ||
      (requiresLocationSelection &&
        !hasToothSelection &&
        !hasHofSelection &&
        !hasBodySelection)
    ) {
      setErrors((current) => ({
        ...current,
        draft: !requiresLocationSelection
          ? 'Preencha plano, procedimento, valor e profissional.'
          : showBodyLocationUi
            ? 'Preencha plano, procedimento, valor, profissional e ao menos uma região corporal.'
            : selectedLocationUiType === 'face_region'
              ? 'Preencha plano, procedimento, valor, profissional e ao menos uma região facial (HOF).'
              : 'Preencha plano, procedimento, valor, profissional e ao menos um dente/região.',
      }));
      return false;
    }

    if (parseBrlCurrencyToCents(draft.value) <= 0) {
      setErrors((current) => ({
        ...current,
        draft: 'Informe um valor válido para o procedimento.',
      }));
      return false;
    }

    if (showBudgetSessions) {
      const sessions = parsePositiveInteger(draft.sessionsCount);
      if (sessions == null || sessions < 1) {
        setErrors((current) => ({
          ...current,
          draft: 'Informe a quantidade de sessões (mínimo 1).',
        }));
        return false;
      }
    }

    if (!selectedPlan || !selectedTreatment || !selectedProfessional) {
      setErrors((current) => ({
        ...current,
        draft: 'Não foi possível validar os dados do procedimento.',
      }));
      return false;
    }

    return true;
  };

  const handleAddOrUpdateTreatment = () => {
    if (!validateDraft() || !selectedPlan || !selectedTreatment || !selectedProfessional) {
      return;
    }

    const teethToAdd = draft.toothNumbers;
    const regionsToAdd = draft.regionLabels;
    const hofToAdd = draft.hofRegionIds;
    const sessionsCount =
      showBudgetSessions && !editingTreatmentId
        ? (parsePositiveInteger(draft.sessionsCount) ?? 1)
        : 1;

    const preserveSessionFields = (
      item: PatientBudgetTreatmentItem,
    ): PatientBudgetTreatmentItem => {
      if (!editingTreatmentId) {
        return item;
      }
      const existing = treatments.find((entry) => entry.id === editingTreatmentId);
      return {
        ...item,
        sessionIndex: existing?.sessionIndex ?? null,
        sessionTotal: existing?.sessionTotal ?? null,
      };
    };

    if (!requiresLocationSelection) {
      const locationType = budgetLocationTypeFromUiType(selectedLocationUiType);
      if (locationType !== 'session' && locationType !== 'none') {
        return;
      }
      const item = preserveSessionFields(
        createLocationFreeTreatmentItem(
          draft,
          locationType,
          selectedPlan.name,
          selectedTreatment.name,
          selectedProfessional.name,
          editingTreatmentId ?? undefined,
        ),
      );
      if (editingTreatmentId) {
        setTreatments((current) =>
          current.map((entry) => (entry.id === editingTreatmentId ? item : entry)),
        );
      } else {
        setTreatments((current) => [
          ...current,
          ...expandBudgetTreatmentsBySessions([item], sessionsCount),
        ]);
      }
      setEditingTreatmentId(null);
      setDraft((current) => ({
        ...current,
        sessionsCount: '1',
        toothNumbers: [],
        regionLabels: [],
        hofRegionIds: [],
        toothFaces: {},
        hofAnnotations: null,
      }));
      setErrors((current) => ({ ...current, draft: undefined, treatments: undefined }));
      return;
    }

    const toothItems = teethToAdd.map((toothNumber) =>
      createTreatmentItem(
        draft,
        toothNumber,
        selectedPlan.name,
        selectedTreatment.name,
        selectedProfessional.name,
      ),
    );
    const regionItems = regionsToAdd.map((locationLabel) =>
      showBodyLocationUi
        ? createCorpBodyTreatmentItem(
            draft,
            locationLabel,
            selectedPlan.name,
            selectedTreatment.name,
            selectedProfessional.name,
          )
        : createBodyRegionTreatmentItem(
            draft,
            locationLabel,
            selectedPlan.name,
            selectedTreatment.name,
            selectedProfessional.name,
          ),
    );
    const hofItems = hofToAdd.map((regionId) =>
      createHofTreatmentItem(
        draft,
        regionId,
        selectedPlan.name,
        selectedTreatment.name,
        selectedProfessional.name,
      ),
    );

    const baseItems = [...toothItems, ...regionItems, ...hofItems];

    if (editingTreatmentId) {
      const [primaryItem, ...additionalItems] = baseItems;
      if (!primaryItem) {
        return;
      }

      const updatedItem = preserveSessionFields({ ...primaryItem, id: editingTreatmentId });

      setTreatments((current) => [
        ...current.map((entry) => (entry.id === editingTreatmentId ? updatedItem : entry)),
        ...additionalItems,
      ]);
    } else {
      setTreatments((current) => [
        ...current,
        ...expandBudgetTreatmentsBySessions(baseItems, sessionsCount),
      ]);
    }

    setEditingTreatmentId(null);
    setDraft((current) => ({
      ...current,
      sessionsCount: '1',
      toothNumbers: [],
      regionLabels: [],
      hofRegionIds: [],
      toothFaces: {},
      hofAnnotations: null,
    }));
    setErrors((current) => ({ ...current, draft: undefined, treatments: undefined }));
  };

  const handleTreatmentAction = (
    treatment: PatientBudgetTreatmentItem,
    action: PatientBudgetTreatmentAction,
  ) => {
    if (action === 'delete') {
      setTreatments((current) => current.filter((item) => item.id !== treatment.id));
      if (editingTreatmentId === treatment.id) {
        setEditingTreatmentId(null);
        setDraft(emptyTreatmentDraft());
      }
      return;
    }

    if (action === 'duplicate') {
      setTreatments((current) => [
        ...current,
        {
          ...treatment,
          id: crypto.randomUUID(),
        },
      ]);
      return;
    }

    if (action === 'edit') {
      if (
        treatment.locationType === 'session' ||
        treatment.locationType === 'none'
      ) {
        setEditingTreatmentId(treatment.id);
        setDraft({
          planId: treatment.planId,
          treatmentId: treatment.treatmentId,
          value: formatCentsToBrlInput(treatment.valueCents),
          professionalId: treatment.professionalId,
          sessionsCount: '1',
          toothNumbers: [],
          regionLabels: [],
          hofRegionIds: [],
          toothFaces: {},
          hofAnnotations: null,
        });
        return;
      }

    const corpBodyRegionId = parseBodyRegionIdFromLabel(treatment.locationLabel);
    const locationLabel = treatment.locationLabel;
    const hofRegionId =
      treatment.locationType === 'body_region' && !corpBodyRegionId
        ? resolveHofRegionIdFromLabel(locationLabel)
        : null;
    const isOdontogramRegion =
      treatment.locationType === 'body_region' &&
      Boolean(locationLabel) &&
      !corpBodyRegionId &&
      locationLabel != null &&
      isOdontogramRegionLabel(locationLabel);

    const toothParsed =
      treatment.locationType === 'tooth' && treatment.locationLabel
        ? parseToothLocationLabel(treatment.locationLabel)
        : null;
    const toothNumber =
      toothParsed?.toothNumber ??
      (treatment.locationType === 'body_region' || treatment.toothNumber === 0
        ? 0
        : treatment.toothNumber);

    setEditingTreatmentId(treatment.id);
    setDraft({
      planId: treatment.planId,
      treatmentId: treatment.treatmentId,
      value: formatCentsToBrlInput(treatment.valueCents),
      professionalId: treatment.professionalId,
      sessionsCount: '1',
      toothNumbers: toothNumber > 0 ? [toothNumber] : [],
      regionLabels: corpBodyRegionId
        ? [corpBodyRegionId]
        : isOdontogramRegion && treatment.locationLabel
          ? [treatment.locationLabel]
          : [],
      hofRegionIds: hofRegionId && !isOdontogramRegion ? [hofRegionId] : [],
      toothFaces:
        toothParsed && toothParsed.faces.length > 0
          ? { [toothParsed.toothNumber]: toothParsed.faces }
          : {},
      hofAnnotations: null,
    });

    const planTreatment = planTreatments.find((item) => item.id === treatment.treatmentId);
    if (
      locationUiTypeUsesHofTab(planTreatment?.locationUiType ?? 'tooth') ||
      (hofRegionId && !isOdontogramRegion)
    ) {
      setOdontogramTab('hof');
    }
    }
  };

  const buildPayload = (): PatientBudgetSheetSubmitPayload | null => {
    const nextErrors: FormErrors = {};

    if (!formValues.description.trim()) {
      nextErrors.description = 'Informe a descrição do orçamento.';
    }

    if (!formValues.responsibleId) {
      nextErrors.responsibleId = 'Selecione o responsável.';
    }

    if (!formValues.date) {
      nextErrors.date = 'Informe a data do orçamento.';
    }

    if (treatments.length === 0) {
      nextErrors.treatments = 'Adicione pelo menos um procedimento ao orçamento.';
    }

    if (statusSelection === 'rejected') {
      if (!rejection.date) {
        nextErrors.rejectionDate = 'Informe a data da reprovação.';
      }
      if (!rejection.reason.trim()) {
        nextErrors.rejectionReason = 'Informe o motivo da reprovação.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return null;
    }

    const subtotalCents = sumPatientBudgetTreatmentCents(treatments);
    const finalValueCents = calculatePatientBudgetFinalCents(subtotalCents, discount);
    const downPaymentCents = parseBrlCurrencyToCents(installment.downPayment);
    const installmentsCount = parsePositiveInteger(installment.installmentsCount);
    const balanceCents = calculateInstallmentBalanceCents(finalValueCents, downPaymentCents);
    const installmentAmountCents = calculateInstallmentAmountCents(
      balanceCents,
      installmentsCount,
    );

    return {
      description: formValues.description.trim(),
      responsibleId: formValues.responsibleId,
      responsible: selectedResponsible?.name ?? '',
      date: toIsoDateOnly(formValues.date!),
      treatments,
      finalValueCents,
      observations: observations.trim(),
      discount,
      installmentConfig: installment,
      installment: installment.enabled
        ? {
            downPaymentCents,
            installmentsCount,
            balanceCents,
            installmentAmountCents,
          }
        : null,
      status: statusSelection,
      rejection:
        statusSelection === 'rejected' && rejection.date
          ? {
              date: toIsoDateOnly(rejection.date),
              reason: rejection.reason.trim(),
            }
          : null,
      emitContractOnApprove,
      printSettings,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setSubmitIntent('save');
    try {
      await onSave(payload, editingBudget?.id);
      onOpenChange(false);
    } finally {
      setSubmitIntent(null);
    }
  };

  const handleApproveClick = () => {
    const payload = buildPayload();
    if (!payload) return;
    setApproveDialogOpen(true);
  };

  const handleConfirmApprove = async (input: PatientBudgetApproveConfirmInput) => {
    const payload = buildPayload();
    if (!payload) return;

    setSubmitIntent('approve');
    try {
      await onApprove(
        {
          ...payload,
          dueDate: toIsoDateOnly(input.dueDate),
          installments: input.installments?.map((row) => ({
            dueDate: toIsoDateOnly(row.dueDate),
            valueCents: row.valueCents,
          })),
        },
        editingBudget?.id,
      );
      setApproveDialogOpen(false);
      onOpenChange(false);
    } finally {
      setSubmitIntent(null);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    onOpenChange(false);
  };

  const subtotalCents = sumPatientBudgetTreatmentCents(treatments);
  const finalValueCents = calculatePatientBudgetFinalCents(subtotalCents, discount);

  const isFormDirty = useMemo(() => {
    if (!isEditing || baselineSnapshotRef.current === null) {
      return false;
    }

    return isPatientBudgetSheetDirty(baselineSnapshotRef.current, {
      formValues,
      treatments,
      observations,
      discount,
      installment,
      statusSelection,
      rejection,
      emitContractOnApprove,
      printSettings,
    });
  }, [
    isEditing,
    formValues,
    treatments,
    observations,
    discount,
    installment,
    statusSelection,
    rejection,
    emitContractOnApprove,
    printSettings,
  ]);

  const showSaveButton = canSaveBudget && (!isEditing || isFormDirty);
  const approveIsPrimary = isEditing && !isFormDirty;
  const saveButtonLabel = isEditing ? 'Salvar alterações' : 'Salvar orçamento';
  const canApprove =
    canApproveBudget && !isApproved && statusSelection !== 'rejected';
  const showApproveButton =
    canApproveBudget &&
    !isApproved &&
    (canSaveBudget || !isFormDirty);

  const handleStatusSelectionChange = (status: PatientBudgetStatusSelection) => {
    setStatusSelection(status);
    if (status === 'rejected' && !rejection.date) {
      setRejection((current) => ({
        ...current,
        date: new Date(),
      }));
    }
    setErrors((current) => ({
      ...current,
      rejectionDate: undefined,
      rejectionReason: undefined,
    }));
  };

  const handleAddDiscount = () => {
    setShowDiscount(true);
    setDiscount({ type: 'fixed', value: EMPTY_BRL_CURRENCY });
  };

  const handleRemoveDiscount = () => {
    setShowDiscount(false);
    setDiscount(null);
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        {...CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS}
        className={cn('flex flex-col gap-0 p-0', CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS)}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="text-lg">
              {isEditing ? 'Editar orçamento' : 'Novo orçamento'}
            </SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Fechar"
              onClick={handleClose}
              disabled={isSaving}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        </SheetHeader>

        <div
          className={cn(
            'relative flex min-h-0 flex-1 flex-col',
            // Mobile: um único scroll (formulário + valor). Desktop: duas colunas.
            'overflow-y-auto overscroll-contain lg:flex-row lg:overflow-hidden',
          )}
        >
          {isSaving ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Salvando orçamento…
              </div>
            </div>
          ) : null}

          <div className="min-w-0 flex-1 lg:min-h-0 lg:overflow-y-auto">
            <div className="space-y-8 px-6 py-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="patient-budget-description">Descrição</Label>
                <Input
                  id="patient-budget-description"
                  value={formValues.description}
                  onChange={(event) => patchForm({ description: event.target.value })}
                  placeholder="Descrição do orçamento"
                  disabled={isSaving}
                  aria-invalid={!!errors.description}
                />
                {errors.description ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.description}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="patient-budget-responsible">Responsável</Label>
                <Select
                  value={formValues.responsibleId || undefined}
                  onValueChange={(responsibleId) => patchForm({ responsibleId })}
                  disabled={isSaving || isMembersLoading || activeProfessionals.length === 0}
                >
                  <SelectTrigger
                    id="patient-budget-responsible"
                    className="w-full"
                    aria-invalid={!!errors.responsibleId}
                  >
                    <SelectValue
                      placeholder={
                        isMembersLoading ? 'Carregando...' : 'Selecionar profissional'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProfessionals.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.responsibleId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.responsibleId}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label>Data</Label>
                <DatePicker
                  value={formValues.date ?? undefined}
                  placeholder="Selecionar data"
                  className="w-full"
                  disabled={isSaving}
                  onChange={(date) => patchForm({ date: date ?? null })}
                />
                {errors.date ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.date}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">Adicionar Procedimento</h3>

              <div
                className={cn(
                  'grid gap-4',
                  (requiresLocationSelection && showBodyLocationUi) ||
                    (showBudgetSessions && !editingTreatmentId)
                    ? 'xl:grid-cols-[minmax(0,10rem)_minmax(0,1.2fr)_minmax(0,6.5rem)_minmax(0,9rem)_minmax(0,1.15fr)_auto]'
                    : 'xl:grid-cols-4',
                )}
              >
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="patient-budget-plan">Plano</Label>
                  <Select
                    value={draft.planId || undefined}
                    onValueChange={handlePlanChange}
                    disabled={isSaving || isPlansLoading || activePlans.length === 0}
                  >
                    <SelectTrigger id="patient-budget-plan" className="w-full">
                      <SelectValue placeholder="Selecionar plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="patient-budget-treatment">Selecione um procedimento</Label>
                  <PatientBudgetTreatmentSelect
                    id="patient-budget-treatment"
                    value={draft.treatmentId}
                    treatments={planTreatments}
                    disabled={isSaving || !draft.planId || planTreatments.length === 0}
                    placeholder={
                      !draft.planId
                        ? 'Selecione um plano'
                        : planTreatments.length === 0
                          ? 'Nenhum procedimento'
                          : 'Selecionar procedimento'
                    }
                    onValueChange={handleTreatmentChange}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="patient-budget-value">Valor</Label>
                  <PlanBrlCurrencyInput
                    id="patient-budget-value"
                    value={draft.value}
                    onValueChange={(value) => patchDraft({ value })}
                    disabled={isSaving}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="patient-budget-professional">Profissional</Label>
                  <Select
                    value={draft.professionalId || undefined}
                    onValueChange={(professionalId) => patchDraft({ professionalId })}
                    disabled={isSaving || isMembersLoading || activeProfessionals.length === 0}
                  >
                    <SelectTrigger id="patient-budget-professional" className="w-full">
                      <SelectValue
                        placeholder={
                          isMembersLoading
                            ? 'Carregando...'
                            : 'Selecionar profissional'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProfessionals.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {requiresLocationSelection && showBodyLocationUi ? (
                  <div className="min-w-0 space-y-1.5">
                    <Label>Selecionar região corporal</Label>
                    <PatientBudgetBodyRegionSelect
                      value={draft.regionLabels}
                      onChange={(regionLabels) => patchDraft({ regionLabels })}
                      disabled={isSaving}
                      placeholder="Selecionar região corporal"
                    />
                  </div>
                ) : null}

                {showBudgetSessions && !editingTreatmentId ? (
                  <div className="w-fit max-w-full space-y-1.5">
                    <Label htmlFor="patient-budget-sessions">
                      Quantas sessões terá o procedimento
                    </Label>
                    <Input
                      id="patient-budget-sessions"
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={draft.sessionsCount}
                      disabled={isSaving}
                      className="w-full"
                      onChange={(event) =>
                        patchDraft({ sessionsCount: event.target.value })
                      }
                    />
                  </div>
                ) : null}
              </div>

              {requiresLocationSelection && showToothLocationUi && selectedLocationUiType === 'tooth' ? (
              <div className="max-w-sm space-y-1.5">
                <Label>Selecionar Dente/Região</Label>
                <PatientBudgetToothRegionSelect
                  value={toothRegionSelectValue}
                  onChange={handleToothRegionSelectChange}
                  toothFaces={draft.toothFaces as Record<number, FaceLetter[]>}
                  disabled={isSaving}
                  placeholder="Selecionar Dente/Região"
                />
              </div>
              ) : null}

              {errors.draft ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.draft}
                </p>
              ) : null}
            </div>

            <div className="space-y-4">
              {showToothLocationUi ? (
                <PatientBudgetOdontogramAccordion
                  value={draft.toothNumbers}
                  onChange={handleOdontogramTeethChange}
                  regionLabels={draft.regionLabels}
                  onRegionLabelsChange={(regionLabels) => patchDraft({ regionLabels })}
                  hofRegionIds={draft.hofRegionIds}
                  onHofChange={(hofRegionIds) => patchDraft({ hofRegionIds })}
                  hofAnnotations={draft.hofAnnotations}
                  onHofAnnotationsChange={(hofAnnotations) => patchDraft({ hofAnnotations })}
                  toothFaces={draft.toothFaces as Record<number, FaceLetter[]>}
                  onToothFacesChange={(toothFaces) => patchDraft({ toothFaces })}
                  facesInteractive={selectedTreatment?.acceptsFaces === true}
                  tab={odontogramTab}
                  onTabChange={setOdontogramTab}
                  listedToothNumbers={treatments
                    .filter((item) => item.locationType !== 'body_region' && item.toothNumber > 0)
                    .map((item) => item.toothNumber)}
                  listedHofRegionIds={treatments
                    .filter((item) => item.locationType === 'body_region')
                    .map((item) => resolveHofRegionIdFromLabel(item.locationLabel))
                    .filter((id): id is string => Boolean(id))}
                  disabled={isSaving}
                />
              ) : showBodyLocationUi ? (
                <PatientBudgetCorpogramAccordion
                  selectedRegionIds={draft.regionLabels}
                  listedRegionIds={listedBodyRegionIds}
                  disabled={isSaving}
                  defaultPatientGender={patientGender}
                  onRegionToggle={handleBodyRegionToggle}
                />
              ) : null}

              <Button
                type="button"
                className="h-10"
                disabled={isSaving}
                onClick={handleAddOrUpdateTreatment}
              >
                {editingTreatmentId ? (
                  'Atualizar procedimento'
                ) : (
                  <>
                    <Plus className="size-4" aria-hidden />
                    Adicionar Procedimento
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">Lista de procedimentos</h3>

              <PatientBudgetTreatmentsTable
                treatments={treatments}
                onTreatmentAction={handleTreatmentAction}
              />

              {errors.treatments ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.treatments}
                </p>
              ) : null}
            </div>
            </div>
          </div>

          <PatientBudgetSummaryPanel
            className="border-t lg:max-h-none lg:overflow-y-auto lg:border-t-0"
            subtotalCents={subtotalCents}
            discount={discount}
            showDiscount={showDiscount}
            installment={installment}
            observations={observations}
            showStatusSelect={showStatusSelect}
            statusSelection={statusSelection}
            rejection={rejection}
            emitContractOnApprove={emitContractOnApprove}
            printSettings={printSettings}
            disabled={isSaving}
            onAddDiscount={handleAddDiscount}
            onDiscountChange={setDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            onInstallmentChange={setInstallment}
            onObservationsChange={setObservations}
            onStatusSelectionChange={handleStatusSelectionChange}
            onRejectionChange={setRejection}
            onEmitContractOnApproveChange={setEmitContractOnApprove}
            onPrintSettingsChange={setPrintSettings}
            rejectionDateError={errors.rejectionDate}
            rejectionReasonError={errors.rejectionReason}
          />
        </div>

        <SheetFooter
          className={cn(
            CLINIC_SHEET_FOOTER_CLASS,
            'flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3',
          )}
        >
          <Button
            type="button"
            variant="outline"
            className={cn(CLINIC_SHEET_FOOTER_BUTTON_CLASS, 'w-full sm:w-auto')}
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          {showApproveButton ? (
            <Button
              type="button"
              variant={approveIsPrimary ? 'default' : 'outline'}
              className={cn(CLINIC_SHEET_FOOTER_BUTTON_CLASS, 'w-full sm:w-auto')}
              onClick={handleApproveClick}
              disabled={isSaving || !canApprove}
            >
              Aprovar
            </Button>
          ) : null}
          {showSaveButton ? (
            <Button
              type="button"
              className={cn(CLINIC_SHEET_FOOTER_BUTTON_CLASS, 'w-full sm:w-auto')}
              onClick={() => void handleSubmit()}
              disabled={isSaving}
            >
              {isSaving && submitIntent === 'save' ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                saveButtonLabel
              )}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>

      <PatientBudgetApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        totalCents={finalValueCents}
        treatmentsCount={treatments.length}
        installment={installment}
        emitContractOnApprove={emitContractOnApprove}
        isApproving={isSaving && submitIntent === 'approve'}
        onConfirm={handleConfirmApprove}
      />
    </>
  );
}
