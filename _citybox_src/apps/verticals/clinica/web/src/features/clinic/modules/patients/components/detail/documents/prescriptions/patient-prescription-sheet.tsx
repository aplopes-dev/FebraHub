'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@citybox/ui';
import {
  Button,
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
import { teamKeys } from '@/features/shared/team/query-keys';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import {
  CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
  CLINIC_NARROW_SHEET_CONTENT_CLASS,
  CLINIC_SHEET_BODY_PADDING_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_HEADER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { useStore } from '@/lib/store-context';
import {
  getPatientDocumentsMutationErrorMessage,
  usePatientPrescriptionMutations,
} from '../../../../hooks/use-patient-documents-queries';
import { getTodayIsoDateOnly, parseIsoDateString, toIsoDateOnly } from '../../../../lib/patient-document-date';
import {
  formatProfessionalCouncilLabel,
  hasProfessionalCouncil,
  toProfessionalCouncilSnapshot,
  type ProfessionalCouncilSnapshot,
} from '../../../../lib/professional-council';
import {
  hasPatientPrescriptionFormErrors,
  validatePatientPrescriptionForm,
} from '../../../../lib/validate-patient-prescription-form';
import {
  DEFAULT_PRESCRIPTION_MEASURE,
  EMPTY_PATIENT_PRESCRIPTION_FORM_VALUES,
  normalizePrescriptionItem,
  type PatientPrescriptionFormErrors,
  type PatientPrescriptionFormValues,
  type PatientPrescriptionRecord,
  type PrescriptionItem,
} from '../../../../types/patient-prescription';
import { ProfessionalCouncilDialog } from '../professional-council-dialog';
import { MedicationSearchCombobox } from './medication-search-combobox';
import { PrescriptionItemCard } from './prescription-item-card';

type PatientPrescriptionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  editingPrescription?: PatientPrescriptionRecord | null;
  onSaved?: (prescription: PatientPrescriptionRecord) => void;
};

function createPrescriptionItem(name: string): PrescriptionItem {
  return {
    id: crypto.randomUUID(),
    name,
    quantity: '1',
    measure: DEFAULT_PRESCRIPTION_MEASURE,
    posology: '',
    notes: '',
  };
}

export function PatientPrescriptionSheet({
  open,
  onOpenChange,
  patientId,
  patientName,
  editingPrescription = null,
  onSaved,
}: PatientPrescriptionSheetProps) {
  const { storeId, clinicStrand } = useStore();
  const queryClient = useQueryClient();
  const { createMutation, updateMutation } = usePatientPrescriptionMutations(patientId);
  const { members, isLoading: isMembersLoading } = useTeamMembers();
  const clinicProfileQuery = useQuery({
    queryKey: ['clinic-profile', storeId],
    queryFn: () => getClinicProfile(storeId),
    enabled: Boolean(storeId) && open,
  });

  const [values, setValues] = useState<PatientPrescriptionFormValues>(
    EMPTY_PATIENT_PRESCRIPTION_FORM_VALUES,
  );
  const [errors, setErrors] = useState<PatientPrescriptionFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [councilDialogOpen, setCouncilDialogOpen] = useState(false);
  const councilResolverRef = useRef<
    ((council: ProfessionalCouncilSnapshot | null) => void) | null
  >(null);

  const activeProfessionals = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );

  const selectedProfessional = useMemo(
    () => activeProfessionals.find((member) => member.id === values.professionalId) ?? null,
    [activeProfessionals, values.professionalId],
  );

  const resetForm = useCallback(() => {
    setValues(EMPTY_PATIENT_PRESCRIPTION_FORM_VALUES);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  const createInitialFormValues = useCallback(
    (): PatientPrescriptionFormValues => ({
      ...EMPTY_PATIENT_PRESCRIPTION_FORM_VALUES,
      issuedDate: getTodayIsoDateOnly(),
    }),
    [],
  );

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    if (editingPrescription) {
      setValues({
        professionalId: editingPrescription.professionalId ?? '',
        issuedDate: editingPrescription.issuedDate ?? '',
        items: editingPrescription.items.map((item) => normalizePrescriptionItem(item)),
      });
      setErrors({});
      return;
    }

    setValues(createInitialFormValues());
    setErrors({});
  }, [createInitialFormValues, editingPrescription, open, resetForm]);

  const patchValues = (patch: Partial<PatientPrescriptionFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
  };

  const handleAddMedication = (name: string) => {
    setValues((current) => ({
      ...current,
      items: [...current.items, createPrescriptionItem(name)],
    }));
    if (errors.items) {
      setErrors((current) => ({ ...current, items: undefined }));
    }
  };

  const handleItemChange = (itemId: string, nextItem: PrescriptionItem) => {
    setValues((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === itemId ? nextItem : item)),
    }));
  };

  const handleItemRemove = (itemId: string) => {
    setValues((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  };

  const promptProfessionalCouncil = useCallback(() => {
    return new Promise<ProfessionalCouncilSnapshot | null>((resolve) => {
      councilResolverRef.current = resolve;
      setCouncilDialogOpen(true);
    });
  }, []);

  const handleSave = async () => {
    const nextErrors = validatePatientPrescriptionForm(values);
    setErrors(nextErrors);

    if (hasPatientPrescriptionFormErrors(nextErrors)) {
      return;
    }

    const professional = activeProfessionals.find(
      (member) => member.id === values.professionalId,
    );
    if (!professional) {
      return;
    }

    let council: ProfessionalCouncilSnapshot | null = null;
    if (!editingPrescription) {
      council = toProfessionalCouncilSnapshot(professional);
      if (!hasProfessionalCouncil(professional)) {
        council = await promptProfessionalCouncil();
        if (!council) {
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const clinicName = clinicProfileQuery.data?.clinicName;

      const record = editingPrescription
        ? await updateMutation.mutateAsync({
            prescriptionId: editingPrescription.id,
            values,
            professionalName: professional.name,
            clinicName,
          })
        : await createMutation.mutateAsync({
            values,
            professionalName: professional.name,
            clinicName,
            council,
          });

      if (!editingPrescription && council) {
        void queryClient.invalidateQueries({ queryKey: teamKeys.members(storeId) });
      }

      toast.success(
        editingPrescription
          ? 'Receituário atualizado com sucesso.'
          : 'Receituário gerado com sucesso.',
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
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className={cn(CLINIC_NARROW_SHEET_CONTENT_CLASS, CLINIC_FLOATING_SHEET_LAYOUT_CLASS)}
        >
          <SheetHeader className={CLINIC_SHEET_HEADER_CLASS}>
            <SheetTitle>
              {editingPrescription ? 'Editar receituário' : 'Novo receituário'}
            </SheetTitle>
          </SheetHeader>

          <div className={cn('relative', CLINIC_SHEET_SCROLL_BODY_CLASS)}>
            <div className={cn('space-y-5', CLINIC_SHEET_BODY_PADDING_CLASS)}>
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <Label htmlFor="rx-professional" className="col-start-1 row-start-1">
                    Profissional
                  </Label>
                  <div className="col-start-1 row-start-2 min-w-0">
                    <Select
                      value={values.professionalId || undefined}
                      onValueChange={(professionalId) => patchValues({ professionalId })}
                      disabled={isMembersLoading || isSubmitting}
                    >
                      <SelectTrigger
                        id="rx-professional"
                        className="w-full max-w-none"
                        aria-invalid={!!errors.professionalId}
                      >
                        <SelectValue
                          placeholder={
                            isMembersLoading ? 'Carregando…' : 'Selecionar profissional'
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

                  {selectedProfessional ? (
                    <div
                      id="rx-council-info"
                      className="col-start-2 row-start-2 flex min-w-0 flex-col justify-center gap-0.5 self-stretch"
                    >
                      <p className="text-[12px] leading-snug text-muted-foreground">
                        Inscrição no conselho
                      </p>
                      <p className="text-sm leading-snug text-foreground">
                        {formatProfessionalCouncilLabel(selectedProfessional) ||
                          'Não informado'}
                      </p>
                    </div>
                  ) : null}
                </div>
                {errors.professionalId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.professionalId}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rx-date">Data do receituário</Label>
                <DatePicker
                  value={parseIsoDateString(values.issuedDate)}
                  disabled={isSubmitting}
                  className="h-9 min-h-9 w-full rounded-3xl border-transparent bg-input/50 px-3 text-sm hover:bg-input/50"
                  onChange={(date) => patchValues({ issuedDate: toIsoDateOnly(date) })}
                />
                {errors.issuedDate ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.issuedDate}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <Label>Medicamentos</Label>
                {values.items.map((item) => (
                  <PrescriptionItemCard
                    key={item.id}
                    item={item}
                    disabled={isSubmitting}
                    onChange={(nextItem) => handleItemChange(item.id, nextItem)}
                    onRemove={() => handleItemRemove(item.id)}
                  />
                ))}

                <MedicationSearchCombobox
                  disabled={isSubmitting}
                  onSelectMedication={handleAddMedication}
                />

                {errors.items ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.items}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
            <Button
              type="button"
              variant="outline"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              onClick={() => onOpenChange(false)}
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
                  Salvando…
                </>
              ) : editingPrescription ? (
                'Salvar alterações'
              ) : (
                'Salvar receituário'
              )}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    <ProfessionalCouncilDialog
      open={councilDialogOpen}
      clinicStrand={clinicStrand}
      onOpenChange={(nextOpen) => {
        setCouncilDialogOpen(nextOpen);
        if (!nextOpen && councilResolverRef.current) {
          const resolve = councilResolverRef.current;
          councilResolverRef.current = null;
          resolve(null);
        }
      }}
      isSubmitting={isSubmitting}
      onConfirm={(council) => {
        const resolve = councilResolverRef.current;
        councilResolverRef.current = null;
        setCouncilDialogOpen(false);
        resolve?.(council);
      }}
    />
    </>
  );
}
