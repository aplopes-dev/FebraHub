'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@citybox/ui';
import {
  Button,
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
import { RichTextEditor } from '@citybox/ui/organisms';
import {
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_HEADER_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { useContractModelsQuery } from '@/features/clinic/modules/settings/contracts/hooks/use-contract-models-query';
import { useStore } from '@/lib/store-context';
import {
  getPatientDocumentsMutationErrorMessage,
  usePatientContractEmissionMutations,
} from '../../../../hooks/use-patient-documents-queries';
import { usePatientDetail } from '../../../../lib/patient-detail-context';
import { interpolateContractVariables } from '../../../../lib/interpolate-contract-variables';
import {
  hasPatientContractEmissionFormErrors,
  formatPatientContractEmissionFormErrors,
  validatePatientContractEmissionForm,
} from '../../../../lib/validate-patient-contract-emission-form';
import {
  EMPTY_PATIENT_CONTRACT_EMISSION_FORM_VALUES,
  type PatientContractEmissionFormErrors,
  type PatientContractEmissionFormValues,
  type PatientContractEmissionRecord,
} from '../../../../types/patient-contract-emission';
import { PatientContractEmissionFormFields } from './patient-contract-emission-form-fields';

type PatientContractEmissionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  editingContract?: PatientContractEmissionRecord | null;
  /** When creating from an approved budget. */
  budgetId?: string | null;
  /** Extra initial values (value, treatments, etc.) merged on open. */
  initialOverrides?: Partial<PatientContractEmissionFormValues> | null;
  onSaved?: (contract: PatientContractEmissionRecord) => void;
};


function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialFormValues(patient: ReturnType<typeof usePatientDetail>): PatientContractEmissionFormValues {
  return {
    ...EMPTY_PATIENT_CONTRACT_EMISSION_FORM_VALUES,
    contractorName: patient.name,
    contractorBirthDate: patient.birthDate,
    contractorCpf: patient.cpf,
    contractorZip: patient.address.zipCode,
    contractorStreet: patient.address.street,
    contractorNeighborhood: patient.address.neighborhood,
    contractorCity: patient.address.city,
    contractorState: patient.address.state,
    contractDate: todayIsoDate(),
  };
}

export function PatientContractEmissionSheet({
  open,
  onOpenChange,
  patientId,
  editingContract = null,
  budgetId = null,
  initialOverrides = null,
  onSaved,
}: PatientContractEmissionSheetProps) {
  const patient = usePatientDetail();
  const { storeId } = useStore();
  const { createMutation, updateMutation } = usePatientContractEmissionMutations(patientId);
  const { data: templates = [], isLoading: isTemplatesLoading } = useContractModelsQuery();
  const clinicProfileQuery = useQuery({
    queryKey: ['clinic-profile', storeId],
    queryFn: () => getClinicProfile(storeId),
    enabled: Boolean(storeId) && open,
  });

  const [values, setValues] = useState<PatientContractEmissionFormValues>(() =>
    buildInitialFormValues(patient),
  );
  const [errors, setErrors] = useState<PatientContractEmissionFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const templateRawRef = useRef('');

  const applyInterpolation = useCallback(
    (baseHtml: string, formValues: PatientContractEmissionFormValues) =>
      interpolateContractVariables(baseHtml, formValues),
    [],
  );

  const patchValues = useCallback(
    (patch: Partial<PatientContractEmissionFormValues>) => {
      setValues((current) => {
        const next = { ...current, ...patch };

        if ('content' in patch && Object.keys(patch).length === 1) {
          return next;
        }

        if (templateRawRef.current) {
          return {
            ...next,
            content: applyInterpolation(templateRawRef.current, next),
          };
        }

        return next;
      });
    },
    [applyInterpolation],
  );

  useEffect(() => {
    if (open) {
      return;
    }

    setValues(EMPTY_PATIENT_CONTRACT_EMISSION_FORM_VALUES);
    setErrors({});
    setIsSubmitting(false);
    templateRawRef.current = '';
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editingContract) {
      setValues({
        ...editingContract.formValues,
        content: editingContract.content,
      });
      setErrors({});
      return;
    }

    const nextValues = {
      ...buildInitialFormValues(patient),
      ...(initialOverrides ?? {}),
    };
    if (clinicProfileQuery.data) {
      nextValues.contractedName =
        nextValues.contractedName || clinicProfileQuery.data.clinicName;
      nextValues.contractedDocument =
        nextValues.contractedDocument || clinicProfileQuery.data.cnpj;
      nextValues.contractedCity =
        nextValues.contractedCity || clinicProfileQuery.data.city;
    }

    setValues(nextValues);
    setErrors({});
    templateRawRef.current = '';
  }, [clinicProfileQuery.data, editingContract?.id, initialOverrides, open, patient.id]);

  useEffect(() => {
    if (!open || editingContract || values.templateId || templates.length === 0) {
      return;
    }
    const defaultTemplate =
      templates.find((item) => item.isDefault) ?? templates[0];
    if (!defaultTemplate) return;
    templateRawRef.current = defaultTemplate.content;
    setValues((current) => {
      const next = { ...current, templateId: defaultTemplate.id };
      return {
        ...next,
        content: applyInterpolation(defaultTemplate.content, next),
      };
    });
  }, [applyInterpolation, editingContract, open, templates, values.templateId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const templateId = editingContract?.templateId ?? values.templateId;
    if (!templateId) {
      templateRawRef.current = '';
      return;
    }

    const template = templates.find((item) => item.id === templateId);
    templateRawRef.current = template?.content ?? '';
  }, [editingContract?.templateId, open, templates, values.templateId]);

  const handleTemplateChange = useCallback(
    (templateId: string) => {
      const template = templates.find((item) => item.id === templateId);
      if (!template) {
        templateRawRef.current = '';
        patchValues({ templateId, content: '' });
        return;
      }

      templateRawRef.current = template.content;
      setValues((current) => {
        const next = { ...current, templateId };
        return {
          ...next,
          content: applyInterpolation(template.content, next),
        };
      });
    },
    [applyInterpolation, patchValues, templates],
  );

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    onOpenChange(false);
  };

  const handleSave = async () => {
    const nextErrors = validatePatientContractEmissionForm(values);
    setErrors(nextErrors);

    if (hasPatientContractEmissionFormErrors(nextErrors)) {
      toast.error('Preencha os campos obrigatórios.', {
        description: formatPatientContractEmissionFormErrors(nextErrors),
      });
      return;
    }

    const template = templates.find((item) => item.id === values.templateId);
    if (!template) {
      return;
    }

    setIsSubmitting(true);

    try {
      const responsibleName =
        clinicProfileQuery.data?.responsible.trim() || 'Responsável';

      const record = editingContract
        ? await updateMutation.mutateAsync({
            contractId: editingContract.id,
            values,
            responsibleName,
          })
        : await createMutation.mutateAsync({
            values,
            responsibleName,
            budgetId: budgetId ?? undefined,
          });

      toast.success(
        editingContract ? 'Contrato atualizado com sucesso.' : 'Contrato gerado com sucesso.',
      );

      onSaved?.(record);
      onOpenChange(false);
    } catch (error) {
      toast.error(getPatientDocumentsMutationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        {...CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS}
        className={cn('flex flex-col gap-0 p-0', CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS)}
      >
        <SheetHeader className={cn(CLINIC_SHEET_HEADER_CLASS, 'text-left')}>
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="text-lg">
              {editingContract ? 'Editar contrato' : 'Novo contrato'}
            </SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Fechar"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        </SheetHeader>

        <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
          {isSubmitting ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Gerando contrato…
              </div>
            </div>
          ) : null}

          <aside
            className={cn(
              'flex w-full shrink-0 flex-col border-b border-border/60 bg-muted/15 max-lg:max-h-56 lg:w-96 lg:border-b-0 lg:border-r',
            )}
          >
            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/50 px-3 py-4">
              <PatientContractEmissionFormFields
                values={values}
                errors={errors}
                disabled={isSubmitting}
                onPatch={patchValues}
              />
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="border-b border-border/50 bg-muted/20 px-6 py-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Select
                  value={values.templateId || undefined}
                  onValueChange={handleTemplateChange}
                  disabled={isTemplatesLoading || isSubmitting}
                >
                  <SelectTrigger
                    id="contract-template"
                    aria-label="Modelo de contrato"
                    className={cn(
                      'h-11 w-full border border-border bg-background text-base font-medium shadow-sm',
                      'data-placeholder:text-muted-foreground',
                      !values.templateId && 'text-muted-foreground',
                    )}
                    aria-invalid={!!errors.templateId}
                  >
                    <SelectValue
                      placeholder={
                        isTemplatesLoading
                          ? 'Carregando modelos…'
                          : 'Selecionar modelo de contrato'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                        {template.isDefault ? ' (padrão)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.templateId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.templateId}
                  </p>
                ) : null}
                {errors.content ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.content}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-6">
              <RichTextEditor
                value={values.content}
                onChange={(content) => patchValues({ content })}
                placeholder="Selecione um modelo para carregar o conteúdo do contrato…"
                ariaLabel="Conteúdo do contrato"
                page="a4"
                disabled={isSubmitting}
                className="min-h-0 flex-1"
              />
            </div>
          </div>
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={() => void handleSave()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                Gerando…
              </>
            ) : editingContract ? (
              'Salvar alterações'
            ) : (
              'Salvar contrato'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
