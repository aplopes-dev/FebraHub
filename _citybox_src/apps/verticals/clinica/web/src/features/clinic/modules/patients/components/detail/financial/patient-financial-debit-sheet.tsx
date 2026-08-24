'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn, TAB_LIST_LINE_CLASS, TAB_TRIGGER_LINE_CLASS } from '@citybox/ui';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  Label,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import { PlanBrlCurrencyInput } from '@/features/clinic/modules/settings/plans/components/plan-brl-currency-input';
import { parseBrlCurrencyToCents } from '../../../lib/patient-budget-form-utils';
import { mapPatientFinancialEntryToDebitFormValues } from '../../../lib/map-patient-financial-entry-to-debit-form';
import { sumPatientFinancialDebitTreatmentsCents } from '../../../lib/sum-patient-financial-debit-treatments';
import type { PatientFinancialEntry } from '../../../types/patient-financial-entry';
import {
  createEmptyPatientFinancialDebitTreatment,
  EMPTY_PATIENT_FINANCIAL_DEBIT_FORM_VALUES,
  type PatientFinancialDebitFormValues,
  type PatientFinancialDebitSavedAttachment,
  type PatientFinancialDebitTreatment,
} from '../../../types/patient-financial-debit-form';
import { PatientFinancialDebitDocumentsTab } from './patient-financial-debit-documents-tab';
import { PatientFinancialDebitTreatmentCard } from './patient-financial-debit-treatment-card';

type PatientFinancialDebitSheetTab = 'debit' | 'documents';

type PatientFinancialDebitSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  editingEntry?: PatientFinancialEntry | null;
  onSubmit: (
    values: PatientFinancialDebitFormValues,
    isEditing: boolean,
    entryId?: string,
  ) => Promise<void>;
  onRemoveSavedAttachment?: (
    entryId: string,
    attachmentId: string,
  ) => Promise<PatientFinancialDebitSavedAttachment[]>;
  onDownloadSavedAttachment?: (
    entryId: string,
    attachment: PatientFinancialDebitSavedAttachment,
  ) => void;
};

function validateCreateDebitForm(values: PatientFinancialDebitFormValues): string | null {
  if (!values.patientId) {
    return 'Selecione o paciente.';
  }

  if (!values.dueDate) {
    return 'Informe a data de vencimento.';
  }

  const hasInvalidTreatment = values.treatments.some((treatment) => {
    return (
      !treatment.planId ||
      !treatment.treatmentId ||
      treatment.toothNumber === null ||
      !treatment.professionalId ||
      parseBrlCurrencyToCents(treatment.value) <= 0
    );
  });

  if (hasInvalidTreatment) {
    return 'Preencha plano, procedimento, dente, valor e profissional em todos os procedimentos.';
  }

  return null;
}

function validateEditDebitForm(values: PatientFinancialDebitFormValues): string | null {
  if (values.treatments.length > 0) {
    const hasInvalidTreatment = values.treatments.some(
      (treatment) =>
        !treatment.professionalId || parseBrlCurrencyToCents(treatment.value) <= 0,
    );
    if (hasInvalidTreatment) {
      return 'Informe valor e profissional em todos os procedimentos.';
    }
    return null;
  }

  if (parseBrlCurrencyToCents(values.installmentValue) <= 0) {
    return 'Informe um valor válido.';
  }

  return null;
}

export function PatientFinancialDebitSheet({
  open,
  onOpenChange,
  patientId,
  patientName,
  editingEntry = null,
  onSubmit,
  onRemoveSavedAttachment,
  onDownloadSavedAttachment,
}: PatientFinancialDebitSheetProps) {
  const isEditing = editingEntry !== null;
  const [activeTab, setActiveTab] = useState<PatientFinancialDebitSheetTab>('debit');
  const [values, setValues] = useState<PatientFinancialDebitFormValues>(
    EMPTY_PATIENT_FINANCIAL_DEBIT_FORM_VALUES,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveTab('debit');

    if (editingEntry) {
      setValues(mapPatientFinancialEntryToDebitFormValues(editingEntry, patientId));
      return;
    }

    setValues({
      ...EMPTY_PATIENT_FINANCIAL_DEBIT_FORM_VALUES,
      patientId,
      dueDate: new Date(),
      treatments: [createEmptyPatientFinancialDebitTreatment()],
    });
  }, [open, patientId, editingEntry]);

  const totalCents = useMemo(() => {
    if (values.treatments.length > 0) {
      return sumPatientFinancialDebitTreatmentsCents(values.treatments);
    }
    return parseBrlCurrencyToCents(values.installmentValue);
  }, [values.installmentValue, values.treatments]);

  const patchValues = useCallback((partial: Partial<PatientFinancialDebitFormValues>) => {
    setValues((current) => ({ ...current, ...partial }));
  }, []);

  const handleTreatmentChange = useCallback(
    (index: number, treatment: PatientFinancialDebitTreatment) => {
      setValues((current) => ({
        ...current,
        treatments: current.treatments.map((item, itemIndex) =>
          itemIndex === index ? treatment : item,
        ),
      }));
    },
    [],
  );

  const handleAddTreatment = useCallback(() => {
    setValues((current) => ({
      ...current,
      treatments: [...current.treatments, createEmptyPatientFinancialDebitTreatment()],
    }));
  }, []);

  const handleRemoveTreatment = useCallback((index: number) => {
    setValues((current) => {
      if (current.treatments.length <= 1) {
        return current;
      }

      return {
        ...current,
        treatments: current.treatments.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }, []);

  const handleClose = () => {
    if (isSaving) return;
    onOpenChange(false);
  };

  const handleSave = async () => {
    const validationError = isEditing
      ? validateEditDebitForm(values)
      : validateCreateDebitForm(values);
    if (validationError) {
      toast.error(validationError);
      setActiveTab('debit');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(values, isEditing, editingEntry?.id);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSavedAttachment = async (attachmentId: string) => {
    if (!editingEntry || !onRemoveSavedAttachment) {
      return;
    }

    setIsSaving(true);
    try {
      const savedAttachments = await onRemoveSavedAttachment(editingEntry.id, attachmentId);
      patchValues({ savedAttachments });
    } finally {
      setIsSaving(false);
    }
  };

  const debitTabLabel = isEditing ? 'Editar débito' : 'Novo débito';

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isSaving) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden bg-muted p-2 sm:max-w-4xl"
      >
        <DialogTitle className="sr-only">{debitTabLabel}</DialogTitle>
        <DialogDescription className="sr-only">
          Formulário de débito financeiro do paciente.
        </DialogDescription>

        <div className="flex max-h-[min(92dvh,56rem)] flex-col overflow-hidden rounded-[10px] border bg-background">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as PatientFinancialDebitSheetTab)}
            className="flex min-h-0 w-full flex-1 flex-col"
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-4">
              <TabsList className={cn(TAB_LIST_LINE_CLASS, 'min-w-0 flex-1')}>
                <TabsTrigger value="debit" className={TAB_TRIGGER_LINE_CLASS}>
                  {debitTabLabel}
                </TabsTrigger>
                <TabsTrigger value="documents" className={TAB_TRIGGER_LINE_CLASS}>
                  Documentos
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="debit"
              className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-4"
            >
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="patient-financial-debit-patient">Paciente</Label>
                    <Input
                      id="patient-financial-debit-patient"
                      value={patientName}
                      readOnly
                      disabled
                      className="border-border bg-input/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Data de vencimento</Label>
                    <DatePicker
                      value={values.dueDate ?? undefined}
                      placeholder="Selecionar data"
                      className="h-9 min-h-9 w-full border-border bg-input/50"
                      disabled={isSaving || isEditing}
                      onChange={(date) => patchValues({ dueDate: date ?? null })}
                    />
                  </div>
                </div>

                <Textarea
                  value={values.observations}
                  onChange={(event) => patchValues({ observations: event.target.value })}
                  placeholder="Observação"
                  disabled={isSaving}
                  className="min-h-20 resize-y border-border bg-input/50"
                />

                {isEditing && values.treatments.length === 0 ? (
                  <div className="space-y-4 rounded-2xl border border-border/50 bg-muted/20 p-4">
                    <div className="space-y-1.5">
                      <Label>Lançamento</Label>
                      <Input
                        value={editingEntry?.name ?? ''}
                        readOnly
                        disabled
                        className="border-border bg-input/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="patient-financial-debit-installment-value">Valor</Label>
                      <PlanBrlCurrencyInput
                        id="patient-financial-debit-installment-value"
                        value={values.installmentValue}
                        onValueChange={(installmentValue) =>
                          patchValues({ installmentValue })
                        }
                        disabled={isSaving}
                        className="w-full border-border bg-input/50"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {values.treatments.map((treatment, index) => (
                        <PatientFinancialDebitTreatmentCard
                          key={treatment.id}
                          index={index}
                          treatment={treatment}
                          fieldsMode={isEditing ? 'edit' : 'create'}
                          canDelete={!isEditing && values.treatments.length > 1}
                          disabled={isSaving}
                          onChange={(nextTreatment) =>
                            handleTreatmentChange(index, nextTreatment)
                          }
                          onDelete={() => handleRemoveTreatment(index)}
                        />
                      ))}
                    </div>

                    {!isEditing ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 w-full"
                        disabled={isSaving}
                        onClick={handleAddTreatment}
                      >
                        <Plus className="mr-2 size-4" aria-hidden />
                        Adicionar outro procedimento
                      </Button>
                    ) : null}
                  </>
                )}

                <Separator />

                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-xl font-semibold text-foreground">
                      {formatBrlCurrencyFromCents(totalCents)}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="documents"
              className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-4"
            >
              <PatientFinancialDebitDocumentsTab
                savedAttachments={values.savedAttachments}
                files={values.attachments}
                disabled={isSaving}
                onFilesChange={(attachments) => patchValues({ attachments })}
                onRemoveSavedAttachment={
                  isEditing && onRemoveSavedAttachment
                    ? handleRemoveSavedAttachment
                    : undefined
                }
                onDownloadSavedAttachment={
                  isEditing && editingEntry && onDownloadSavedAttachment
                    ? (attachment) =>
                        onDownloadSavedAttachment(editingEntry.id, attachment)
                    : undefined
                }
              />
            </TabsContent>
          </Tabs>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-3">
            <Button type="button" variant="ghost" disabled={isSaving} onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => {
                void handleSave();
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvar
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
