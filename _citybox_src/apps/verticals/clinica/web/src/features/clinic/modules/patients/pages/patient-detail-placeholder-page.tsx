'use client';

import { PatientDetailTabPlaceholder } from '../components/detail/patient-detail-tab-placeholder';
import { getPatientDetailTabDefinition } from '../lib/patient-detail-tabs';
import type { PatientDetailTabValue } from '../lib/patient-detail-tabs';

type PatientDetailPlaceholderPageProps = {
  tab: PatientDetailTabValue;
};

export function PatientDetailPlaceholderPage({ tab }: PatientDetailPlaceholderPageProps) {
  const definition = getPatientDetailTabDefinition(tab);

  return (
    <PatientDetailTabPlaceholder
      title={definition.placeholderTitle}
      description={definition.placeholderDescription}
    />
  );
}
