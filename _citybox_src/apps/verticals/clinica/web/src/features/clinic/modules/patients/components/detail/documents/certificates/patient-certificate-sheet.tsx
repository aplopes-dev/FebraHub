'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@citybox/ui';
import {
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
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
  formatProfessionalCouncilLabel,
  hasProfessionalCouncil,
  toProfessionalClinicalProfile,
  toProfessionalCouncilSnapshot,
  type ProfessionalCouncilSnapshot,
} from '../../../../lib/professional-council';
import {
  getPatientDocumentsMutationErrorMessage,
  usePatientCertificateMutations,
} from '../../../../hooks/use-patient-documents-queries';
import { getTodayIsoDateOnly, parseIsoDateString, toIsoDateOnly } from '../../../../lib/patient-document-date';
import {
  hasPatientCertificateFormErrors,
  validatePatientCertificateForm,
} from '../../../../lib/validate-patient-certificate-form';
import {
  EMPTY_PATIENT_CERTIFICATE_FORM_VALUES,
  normalizePatientCertificateFormValues,
  type PatientCertificateFormErrors,
  type PatientCertificateFormValues,
  type PatientCertificateRecord,
  type PatientCertificateType,
} from '../../../../types/patient-certificate';
import { ProfessionalCouncilDialog } from '../professional-council-dialog';
import { PatientCertificateTimeField } from './patient-certificate-time-select';

type PatientCertificateSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  onSaved?: (certificate: PatientCertificateRecord) => void;
};

export function PatientCertificateSheet({
  open,
  onOpenChange,
  patientId,
  patientName,
  onSaved,
}: PatientCertificateSheetProps) {
  const { storeId, clinicStrand } = useStore();
  const queryClient = useQueryClient();
  const { createMutation } = usePatientCertificateMutations(patientId);
  const { members, isLoading: isMembersLoading } = useTeamMembers();
  const clinicProfileQuery = useQuery({
    queryKey: ['clinic-profile', storeId],
    queryFn: () => getClinicProfile(storeId),
    enabled: Boolean(storeId) && open,
  });

  const [values, setValues] = useState<PatientCertificateFormValues>(
    EMPTY_PATIENT_CERTIFICATE_FORM_VALUES,
  );
  const [errors, setErrors] = useState<PatientCertificateFormErrors>({});
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

  const selectedProfile = useMemo(() => {
    if (!selectedProfessional) {
      return null;
    }

    return toProfessionalClinicalProfile(
      selectedProfessional,
      selectedProfessional.name,
    );
  }, [selectedProfessional]);

  const promptProfessionalCouncil = useCallback(() => {
    return new Promise<ProfessionalCouncilSnapshot | null>((resolve) => {
      councilResolverRef.current = resolve;
      setCouncilDialogOpen(true);
    });
  }, []);

  const resetForm = useCallback(() => {
    setValues(EMPTY_PATIENT_CERTIFICATE_FORM_VALUES);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  const createInitialFormValues = useCallback(
    (): PatientCertificateFormValues => ({
      ...EMPTY_PATIENT_CERTIFICATE_FORM_VALUES,
      issuedDate: getTodayIsoDateOnly(),
    }),
    [],
  );

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    setValues(createInitialFormValues());
    setErrors({});
  }, [createInitialFormValues, open, resetForm]);

  const patchValues = (patch: Partial<PatientCertificateFormValues>) => {
    setValues((current) => normalizePatientCertificateFormValues({ ...current, ...patch }));
  };

  const handleSave = async () => {
    const nextErrors = validatePatientCertificateForm(values);
    setErrors(nextErrors);

    if (hasPatientCertificateFormErrors(nextErrors) || !selectedProfessional) {
      return;
    }

    let council = toProfessionalCouncilSnapshot(selectedProfessional);
    if (!hasProfessionalCouncil(selectedProfessional)) {
      council = await promptProfessionalCouncil();
      if (!council) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const record = await createMutation.mutateAsync({
        values,
        professionalName: selectedProfessional.name,
        clinicName: clinicProfileQuery.data?.clinicName,
        council,
      });

      void queryClient.invalidateQueries({ queryKey: teamKeys.members(storeId) });

      onSaved?.(record);
      onOpenChange(false);
      toast.success('Atestado gerado com sucesso.');
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
            <SheetTitle>Novo atestado</SheetTitle>
          </SheetHeader>

          <div className={cn('relative', CLINIC_SHEET_SCROLL_BODY_CLASS)}>
            <div className={cn('space-y-5', CLINIC_SHEET_BODY_PADDING_CLASS)}>
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <Label htmlFor="cert-professional" className="col-start-1 row-start-1">
                    Profissional
                  </Label>
                  <div className="col-start-1 row-start-2 min-w-0">
                    <Select
                      value={values.professionalId || undefined}
                      onValueChange={(professionalId) => patchValues({ professionalId })}
                      disabled={isMembersLoading || isSubmitting}
                    >
                      <SelectTrigger
                        id="cert-professional"
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
                      id="cert-council-info"
                      className="col-start-2 row-start-2 flex min-w-0 flex-col justify-center gap-0.5 self-stretch"
                    >
                      <p className="text-[12px] leading-snug text-muted-foreground">
                        Inscrição no conselho
                      </p>
                      <p className="text-sm leading-snug text-foreground">
                        {selectedProfile && formatProfessionalCouncilLabel(selectedProfile)
                          ? formatProfessionalCouncilLabel(selectedProfile)
                          : 'Não informado'}
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

              <div className="space-y-2">
                <Label>Tipo de atestado</Label>
                <RadioGroup
                  value={values.type}
                  onValueChange={(type) => {
                    const nextType = type as PatientCertificateType;
                    patchValues({
                      type: nextType,
                      ...(nextType === 'days'
                        ? { startTime: '', endTime: '' }
                        : { daysCount: '' }),
                    });
                    setErrors((current) => ({
                      ...current,
                      daysCount: undefined,
                      startTime: undefined,
                      endTime: undefined,
                    }));
                  }}
                  className="grid gap-2"
                  disabled={isSubmitting}
                >
                  <label
                    htmlFor="cert-type-days"
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 px-4 py-3"
                  >
                    <RadioGroupItem id="cert-type-days" value="days" />
                    <span className="text-sm">Atestado de dias</span>
                  </label>
                  <label
                    htmlFor="cert-type-attendance"
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 px-4 py-3"
                  >
                    <RadioGroupItem id="cert-type-attendance" value="attendance" />
                    <span className="text-sm">Presença na consulta</span>
                  </label>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cert-date">Data do atestado</Label>
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

                {values.type === 'days' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="cert-days">Quantidade de dias</Label>
                    <Input
                      id="cert-days"
                      type="number"
                      min={1}
                      value={values.daysCount ?? ''}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.daysCount}
                      onChange={(event) => patchValues({ daysCount: event.target.value })}
                    />
                    {errors.daysCount ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.daysCount}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="cert-start-time">Hora inicial</Label>
                      <PatientCertificateTimeField
                        id="cert-start-time"
                        value={values.startTime ?? ''}
                        disabled={isSubmitting}
                        invalid={!!errors.startTime}
                        onChange={(startTime) => patchValues({ startTime })}
                      />
                      {errors.startTime ? (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.startTime}
                        </p>
                      ) : null}
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="cert-end-time">Hora final</Label>
                      <PatientCertificateTimeField
                        id="cert-end-time"
                        value={values.endTime ?? ''}
                        disabled={isSubmitting}
                        invalid={!!errors.endTime}
                        onChange={(endTime) => patchValues({ endTime })}
                      />
                      {errors.endTime ? (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.endTime}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cert-cid">CID</Label>
                <Input
                  id="cert-cid"
                  value={values.cid ?? ''}
                  disabled={isSubmitting}
                  placeholder="Opcional"
                  onChange={(event) => patchValues({ cid: event.target.value })}
                />
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
              ) : (
                'Salvar atestado'
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
