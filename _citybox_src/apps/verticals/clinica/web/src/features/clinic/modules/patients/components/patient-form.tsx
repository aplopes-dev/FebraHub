'use client';

import { useEffect, useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@citybox/ui/atoms';
import type { ClinicPlan } from '../../settings/plans/types/clinic-plan';
import {
  getFirstPatientFormErrorField,
  PATIENT_FORM_FIELD_ELEMENT_ID,
  PATIENT_FORM_FIELD_TAB,
} from '../lib/patient-form-validation';
import type { PatientCategory, PatientCategoryInput } from '../types/patient-category';
import type {
  PatientReferralOrigin,
  PatientReferralOriginInput,
} from '../types/patient-referral-origin';
import type {
  ExternalReferralProfessional,
  ExternalReferralProfessionalInput,
} from '../types/external-referral-professional';
import type { PatientFormErrors, PatientFormValues } from '../types/patient-form';
import { PatientAdditionalInfoPanel } from './patient-additional-info-panel';
import { PatientAddressPanel } from './patient-address-panel';
import { PatientDataFields } from './patient-data-fields';
import { PatientGuardianFields } from './patient-guardian-fields';
import { PatientPlanPanel } from './patient-plan-panel';
import { PatientSheetSection } from './patient-sheet-section';

export type PatientFormProps = {
  values: PatientFormValues;
  errors: PatientFormErrors;
  errorFocusToken?: number;
  categories: PatientCategory[];
  referralOrigins: PatientReferralOrigin[];
  externalProfessionals: ExternalReferralProfessional[];
  plans: ClinicPlan[];
  isPlansLoading?: boolean;
  disabled?: boolean;
  onPatch: (partial: Partial<PatientFormValues>) => void;
  onCreateCategory: (input: PatientCategoryInput) => Promise<PatientCategory>;
  onCreateReferralOrigin: (
    input: PatientReferralOriginInput,
  ) => Promise<PatientReferralOrigin>;
  onCreateExternalProfessional: (
    input: ExternalReferralProfessionalInput,
  ) => Promise<ExternalReferralProfessional>;
  onUpdateExternalProfessional: (
    id: string,
    input: ExternalReferralProfessionalInput,
  ) => Promise<ExternalReferralProfessional>;
  onDeleteExternalProfessional: (id: string) => Promise<void>;
};

/** Formulário completo de paciente — reutilizável em sheet, página ou modal. */
export function PatientForm({
  values,
  errors,
  errorFocusToken = 0,
  categories,
  referralOrigins,
  externalProfessionals,
  plans,
  isPlansLoading = false,
  disabled = false,
  onPatch,
  onCreateCategory,
  onCreateReferralOrigin,
  onCreateExternalProfessional,
  onUpdateExternalProfessional,
  onDeleteExternalProfessional,
}: PatientFormProps) {
  const [activeTab, setActiveTab] = useState('additional');

  useEffect(() => {
    if (errorFocusToken === 0) return;

    const firstErrorField = getFirstPatientFormErrorField(errors);
    if (!firstErrorField) return;

    const tab = PATIENT_FORM_FIELD_TAB[firstErrorField];
    if (tab) {
      setActiveTab(tab);
    }

    const elementId = PATIENT_FORM_FIELD_ELEMENT_ID[firstErrorField];
    if (!elementId) return;

    requestAnimationFrame(() => {
      document.getElementById(elementId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, [errorFocusToken, errors]);

  return (
    <div className="flex flex-col gap-5">
      <PatientSheetSection title="Dados do paciente">
        <PatientDataFields
          values={values}
          errors={errors}
          categories={categories}
          referralOrigins={referralOrigins}
          externalProfessionals={externalProfessionals}
          disabled={disabled}
          onPatch={onPatch}
          onCreateCategory={onCreateCategory}
          onCreateReferralOrigin={onCreateReferralOrigin}
          onCreateExternalProfessional={onCreateExternalProfessional}
          onUpdateExternalProfessional={onUpdateExternalProfessional}
          onDeleteExternalProfessional={onDeleteExternalProfessional}
        />
      </PatientSheetSection>

      <PatientSheetSection title="Dados do responsável" bordered>
        <PatientGuardianFields
          values={values}
          errors={errors}
          disabled={disabled}
          onPatch={onPatch}
        />
      </PatientSheetSection>

      <PatientSheetSection bordered>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-4">
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-6 rounded-none border-b border-border/60 bg-transparent p-0"
          >
            <TabsTrigger value="additional" className="rounded-none px-0 pb-3">
              Informações adicionais
            </TabsTrigger>
            <TabsTrigger value="plan" className="rounded-none px-0 pb-3">
              Plano
            </TabsTrigger>
            <TabsTrigger value="address" className="rounded-none px-0 pb-3">
              Endereço
            </TabsTrigger>
          </TabsList>

          <TabsContent value="additional" className="mt-0">
            <PatientAdditionalInfoPanel
              values={values}
              errors={errors}
              disabled={disabled}
              onPatch={onPatch}
            />
          </TabsContent>

          <TabsContent value="plan" className="mt-0">
            <PatientPlanPanel
              values={values}
              errors={errors}
              plans={plans}
              isPlansLoading={isPlansLoading}
              disabled={disabled}
              onPatch={onPatch}
            />
          </TabsContent>

          <TabsContent value="address" className="mt-0">
            <PatientAddressPanel values={values} disabled={disabled} onPatch={onPatch} />
          </TabsContent>
        </Tabs>
      </PatientSheetSection>
    </div>
  );
}
