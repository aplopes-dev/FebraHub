'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Download,
  FileSignature,
  GitCompareArrows,
  PenLine,
  StickyNote,
} from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import { TAB_LIST_LINE_CLASS, TAB_TRIGGER_LINE_CLASS } from '@citybox/ui';
import { useTeamMembers } from '@/features/shared/team';
import {
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { toPatientNutritionInitiatedAt } from '../../../lib/patient-treatment-evolution';
import {
  createEmptyNutritionTreatmentPlan,
  parseNutritionTreatmentPlan,
} from '../../../lib/nutrition-treatment-plan-fields';
import {
  createEmptyNutritionBody,
  parseNutritionBody,
  toPatientGender,
  validatePetroskiBodyForSave,
} from '../../../lib/nutrition-body-composition';
import { ageYearsFromBirthDate } from '../../../lib/nutrition-petroski';
import {
  EMPTY_NUTRITION_ANAMNESIS_FORM,
  PatientNutritionAnamnesisForm,
  PatientNutritionAnamnesisSnapshotView,
  toNutritionInitAnamnesisPayload,
  type PatientNutritionAnamnesisFormValue,
} from './patient-nutrition-anamnesis-form';
import { PatientNutritionBodyForm } from './patient-nutrition-body-form';
import { PatientNutritionNotesList } from './patient-nutrition-notes-list';
import { PatientNutritionTreatmentPlanForm } from './patient-nutrition-treatment-plan-form';
import type { PatientNutritionNote } from '../../../types/patient-nutrition-note';
import type {
  PatientTreatment,
  PatientTreatmentEvolution,
} from '../../../types/patient-treatment';
import type { PatientNutritionBody } from '../../../types/patient-nutrition-body';
import type { PatientNutritionTreatmentPlan } from '../../../types/patient-nutrition-treatment-plan';
import type { PatientNutritionInitPayload } from '../../../types/patient-nutrition-init';

type NutritionInitTab = 'anamnesis' | 'body' | 'treatmentPlan';

/** Na visualização as três partes ficam na mesma página, uma abaixo da outra. */
function NutritionInitSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

type PatientNutritionInitSheetProps = {
  open: boolean;
  treatment: PatientTreatment | null;
  /** Define as dobras obrigatórias do protocolo de Petróski na aba Corporal. */
  patientGender?: string | null;
  /** Idade no cálculo de Petróski (yyyy-MM-dd). */
  patientBirthDate?: string | null;
  isSubmitting?: boolean;
  /** Visualização do atendimento salvo: campos travados e ações no rodapé. */
  readOnly?: boolean;
  initialPayload?: PatientNutritionInitPayload | null;
  /** Notas do atendimento — listadas no fim do sheet, da mais antiga à mais nova. */
  notes?: readonly PatientNutritionNote[];
  /** Assinatura do atendimento: define se o rodapé oferece assinar ou consultar. */
  signatureStatus?: PatientTreatmentEvolution['signatureStatus'];
  onOpenChange: (open: boolean) => void;
  onSave: (payload: PatientNutritionInitPayload) => Promise<void>;
  onAddNote?: () => void;
  onEditNote?: (note: PatientNutritionNote) => void;
  onDownloadPdf?: () => void;
  onSignAttendance?: () => void;
  onViewSignature?: () => void;
  onCompare?: () => void;
};

export function PatientNutritionInitSheet({
  open,
  treatment,
  patientGender,
  patientBirthDate,
  isSubmitting = false,
  readOnly = false,
  initialPayload = null,
  notes,
  signatureStatus = 'unsigned',
  onOpenChange,
  onSave,
  onAddNote,
  onEditNote,
  onDownloadPdf,
  onSignAttendance,
  onViewSignature,
  onCompare,
}: PatientNutritionInitSheetProps) {
  const { members, isLoading: isMembersLoading } = useTeamMembers();
  const [activeTab, setActiveTab] = useState<NutritionInitTab>('anamnesis');
  const [professionalId, setProfessionalId] = useState('');
  const [initiatedDate, setInitiatedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [anamnesis, setAnamnesis] = useState<PatientNutritionAnamnesisFormValue>(
    EMPTY_NUTRITION_ANAMNESIS_FORM,
  );
  const [anamnesisError, setAnamnesisError] = useState<string | null>(null);
  const [body, setBody] = useState<PatientNutritionBody>(
    createEmptyNutritionBody,
  );
  const [treatmentPlan, setTreatmentPlan] =
    useState<PatientNutritionTreatmentPlan>(createEmptyNutritionTreatmentPlan);
  const [error, setError] = useState<string | null>(null);

  const activeProfessionals = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );

  useEffect(() => {
    if (!open) {
      setActiveTab('anamnesis');
      setProfessionalId('');
      setInitiatedDate(new Date());
      setAnamnesis(EMPTY_NUTRITION_ANAMNESIS_FORM);
      setBody(createEmptyNutritionBody());
      setTreatmentPlan(createEmptyNutritionTreatmentPlan());
      setError(null);
      setAnamnesisError(null);
      return;
    }

    setProfessionalId(
      initialPayload?.professionalId ?? treatment?.professionalId ?? '',
    );
    setInitiatedDate(
      initialPayload?.initiatedAt
        ? new Date(initialPayload.initiatedAt)
        : new Date(),
    );
    setAnamnesis(EMPTY_NUTRITION_ANAMNESIS_FORM);
    setBody(parseNutritionBody(initialPayload?.body));
    setTreatmentPlan(parseNutritionTreatmentPlan(initialPayload?.treatmentPlan));
    setError(null);
    setAnamnesisError(null);
  }, [open, initialPayload, treatment]);

  const handleSave = useCallback(async () => {
    if (!treatment) return;

    const professional = activeProfessionals.find(
      (member) => member.id === professionalId,
    );
    if (!professional || !initiatedDate) {
      setError('Selecione o profissional e a data.');
      return;
    }

    if (anamnesisError) {
      setError(anamnesisError);
      return;
    }

    const gender = toPatientGender(patientGender);
    const petroskiError = validatePetroskiBodyForSave(
      body,
      gender,
      ageYearsFromBirthDate(patientBirthDate, initiatedDate),
    );
    if (petroskiError) {
      setError(petroskiError);
      setActiveTab('body');
      return;
    }

    setError(null);
    await onSave({
      treatmentId: treatment.id,
      professionalId: professional.id,
      professionalName: professional.name,
      initiatedAt: toPatientNutritionInitiatedAt(initiatedDate),
      anamnesis: toNutritionInitAnamnesisPayload(anamnesis) ?? {},
      body: { ...body },
      treatmentPlan: { ...treatmentPlan },
    });
  }, [
    activeProfessionals,
    anamnesis,
    anamnesisError,
    body,
    initiatedDate,
    onSave,
    patientBirthDate,
    patientGender,
    treatmentPlan,
    professionalId,
    treatment,
  ]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        {...CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS}
        className={cn(
          'flex flex-col gap-0 p-0',
          CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
        )}
      >
        <SheetHeader className="shrink-0 space-y-1 px-6 pt-5 pb-0">
          <SheetTitle className="font-bold">
            {readOnly ? 'Visualizar atendimento' : 'Inicializar acompanhamento'}
          </SheetTitle>
          {readOnly ? null : (
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as NutritionInitTab)}
            >
              <TabsList className={cn(TAB_LIST_LINE_CLASS, 'mt-2')}>
                <TabsTrigger value="anamnesis" className={TAB_TRIGGER_LINE_CLASS}>
                  Anamnese
                </TabsTrigger>
                <TabsTrigger value="body" className={TAB_TRIGGER_LINE_CLASS}>
                  Corporal
                </TabsTrigger>
                <TabsTrigger
                  value="treatmentPlan"
                  className={TAB_TRIGGER_LINE_CLASS}
                >
                  Plano de procedimento
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </SheetHeader>

        <div className={CLINIC_SHEET_SCROLL_BODY_CLASS}>
          <div className="mx-auto w-full max-w-4xl space-y-6 px-6 pt-4 pb-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nutrition-init-professional">Profissional</Label>
                <Select
                  value={professionalId || undefined}
                  onValueChange={setProfessionalId}
                  disabled={readOnly || isSubmitting || isMembersLoading}
                >
                  <SelectTrigger id="nutrition-init-professional" className="w-full">
                    <SelectValue placeholder="Selecione" />
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
              <div className="space-y-1.5">
                <Label>Data</Label>
                <DatePicker
                  value={initiatedDate}
                  disabled={readOnly || isSubmitting}
                  placeholder="Selecionar data"
                  className="h-10 min-h-10 w-full rounded-3xl border-transparent bg-input/50 px-3 hover:bg-input/50"
                  onChange={(date) => setInitiatedDate(date ?? new Date())}
                />
              </div>
            </div>

            {readOnly ? (
              <div className="space-y-8">
                <Separator />

                <NutritionInitSection title="Anamnese">
                  <PatientNutritionAnamnesisSnapshotView
                    section={initialPayload?.anamnesis}
                  />
                </NutritionInitSection>

                <Separator />

                <NutritionInitSection title="Corporal">
                  <PatientNutritionBodyForm
                    value={body}
                    gender={toPatientGender(patientGender)}
                    patientBirthDate={patientBirthDate}
                    disabled
                    onChange={setBody}
                  />
                </NutritionInitSection>

                <Separator />

                <NutritionInitSection title="Plano de procedimento">
                  <PatientNutritionTreatmentPlanForm
                    value={treatmentPlan}
                    disabled
                    onChange={setTreatmentPlan}
                  />
                </NutritionInitSection>

                {notes && notes.length > 0 ? (
                  <>
                    <Separator />
                    <PatientNutritionNotesList
                      notes={notes}
                      onEdit={onEditNote}
                    />
                  </>
                ) : null}
              </div>
            ) : (
              <>
                {activeTab === 'anamnesis' ? (
                  <PatientNutritionAnamnesisForm
                    value={anamnesis}
                    disabled={isSubmitting}
                    onChange={setAnamnesis}
                    onValidityChange={setAnamnesisError}
                  />
                ) : null}

                {activeTab === 'body' ? (
                  <PatientNutritionBodyForm
                    value={body}
                    gender={toPatientGender(patientGender)}
                    patientBirthDate={patientBirthDate}
                    disabled={isSubmitting}
                    onChange={setBody}
                  />
                ) : null}

                {activeTab === 'treatmentPlan' ? (
                  <PatientNutritionTreatmentPlanForm
                    value={treatmentPlan}
                    disabled={isSubmitting}
                    onChange={setTreatmentPlan}
                  />
                ) : null}
              </>
            )}

            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          {readOnly ? (
            <>
              <Button
                type="button"
                variant="outline"
                className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              <Button
                type="button"
                variant="outline"
                className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
                onClick={() => onAddNote?.()}
              >
                <StickyNote className="mr-2 size-4" aria-hidden />
                Adicionar nota
              </Button>
              <Button
                type="button"
                variant="outline"
                className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
                onClick={() => onDownloadPdf?.()}
              >
                <Download className="mr-2 size-4" aria-hidden />
                Baixar PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
                onClick={() => onCompare?.()}
              >
                <GitCompareArrows className="mr-2 size-4" aria-hidden />
                Comparar
              </Button>
              {signatureStatus === 'unsigned' ? (
                <Button
                  type="button"
                  className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
                  onClick={() => onSignAttendance?.()}
                >
                  <PenLine className="mr-2 size-4" aria-hidden />
                  Assinar atendimento
                </Button>
              ) : (
                <Button
                  type="button"
                  className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
                  onClick={() => onViewSignature?.()}
                >
                  <FileSignature className="mr-2 size-4" aria-hidden />
                  Ver assinatura
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
                disabled={isSubmitting}
                onClick={() => {
                  void handleSave();
                }}
              >
                {isSubmitting ? 'Salvando…' : 'Salvar'}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
