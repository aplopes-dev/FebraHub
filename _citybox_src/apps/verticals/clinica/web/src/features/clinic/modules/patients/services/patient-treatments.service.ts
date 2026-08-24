import { clinicaFetch } from '@/features/clinic/shared/api';
import { formatBodyRegionLocationLabel } from '@/lib/body-region-location';
import {
  budgetLocationTypeFromUiType,
  locationUiTypeRequiresSelection,
  type ClinicPlanLocationUiType,
} from '@/features/clinic/modules/settings/plans/data/specialty-location-ui-type';
import { HOF_REGIONS } from '../components/detail/budgets/odontogram/odontogram-data';
import {
  toPatientTreatment,
  toPatientTreatmentFinalizeBody,
  toPatientTreatmentUpdateBody,
  toStandaloneTreatmentCreateBody,
} from '../lib/patient-treatment-api-mappers';
import type {
  PatientTreatment,
  PatientTreatmentEditFormValues,
  PatientStandaloneTreatmentDraft,
  PatientTreatmentFinalizePayload,
} from '../types/patient-treatment';
import type {
  PatientNutritionInitiationApiItem,
  PatientNutritionInitiationSummaryApiItem,
  PatientNutritionInitPayload,
} from '../types/patient-nutrition-init';
import type { PatientTreatmentApiItem } from '../types/patient-treatment-api';

type TreatmentEnvelope = { data: PatientTreatmentApiItem };
type TreatmentListEnvelope = { data: PatientTreatmentApiItem[] };

export async function listPatientTreatments(
  storeId: string,
  patientId: string,
): Promise<PatientTreatment[]> {
  const res = await clinicaFetch<TreatmentListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/treatments`,
  );

  return res.data.map(toPatientTreatment);
}

export async function createPatientTreatment(
  storeId: string,
  patientId: string,
  body: ReturnType<typeof toStandaloneTreatmentCreateBody>,
): Promise<PatientTreatment> {
  const res = await clinicaFetch<TreatmentEnvelope>(
    storeId,
    `/v1/patients/${patientId}/treatments`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );

  return toPatientTreatment(res.data);
}

export async function createPatientTreatmentsFromDraft(
  storeId: string,
  patientId: string,
  draft: PatientStandaloneTreatmentDraft,
  professionalName: string,
  locationUiType?: ClinicPlanLocationUiType,
): Promise<PatientTreatment[]> {
  const created: PatientTreatment[] = [];

  if (locationUiType && !locationUiTypeRequiresSelection(locationUiType)) {
    const locationType = budgetLocationTypeFromUiType(locationUiType);
    const treatment = await createPatientTreatment(
      storeId,
      patientId,
      toStandaloneTreatmentCreateBody(
        draft,
        { type: locationType, label: '' },
        professionalName,
      ),
    );
    created.push(treatment);
    return created;
  }

  for (const toothNumber of draft.toothNumbers) {
    const treatment = await createPatientTreatment(
      storeId,
      patientId,
      toStandaloneTreatmentCreateBody(
        draft,
        { type: 'tooth', label: String(toothNumber) },
        professionalName,
      ),
    );
    created.push(treatment);
  }

  for (const regionId of draft.regionLabels) {
    const treatment = await createPatientTreatment(
      storeId,
      patientId,
      toStandaloneTreatmentCreateBody(
        draft,
        { type: 'body_region', label: formatBodyRegionLocationLabel(regionId) },
        professionalName,
      ),
    );
    created.push(treatment);
  }

  for (const regionId of draft.hofRegionIds) {
    const region = HOF_REGIONS.find((item) => item.id === regionId);
    const treatment = await createPatientTreatment(
      storeId,
      patientId,
      toStandaloneTreatmentCreateBody(
        draft,
        { type: 'body_region', label: region?.label ?? regionId },
        professionalName,
      ),
    );
    created.push(treatment);
  }

  return created;
}

export async function updatePatientTreatment(
  storeId: string,
  patientId: string,
  treatmentId: string,
  values: PatientTreatmentEditFormValues,
): Promise<PatientTreatment> {
  const res = await clinicaFetch<TreatmentEnvelope>(
    storeId,
    `/v1/patients/${patientId}/treatments/${treatmentId}`,
    {
      method: 'PUT',
      body: JSON.stringify(toPatientTreatmentUpdateBody(values)),
    },
  );

  return toPatientTreatment(res.data);
}

export async function deletePatientTreatment(
  storeId: string,
  patientId: string,
  treatmentId: string,
): Promise<void> {
  await clinicaFetch<void>(storeId, `/v1/patients/${patientId}/treatments/${treatmentId}`, {
    method: 'DELETE',
  });
}

export async function reorderPatientTreatments(
  storeId: string,
  patientId: string,
  orderedIds: string[],
): Promise<PatientTreatment[]> {
  const res = await clinicaFetch<TreatmentListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/treatments/reorder`,
    {
      method: 'PATCH',
      body: JSON.stringify({ orderedIds }),
    },
  );

  return res.data.map(toPatientTreatment);
}

export async function finalizePatientTreatments(
  storeId: string,
  patientId: string,
  payload: PatientTreatmentFinalizePayload,
): Promise<PatientTreatment[]> {
  const res = await clinicaFetch<TreatmentListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/treatments/finalize`,
    {
      method: 'PATCH',
      body: JSON.stringify(toPatientTreatmentFinalizeBody(payload)),
    },
  );

  return res.data.map(toPatientTreatment);
}

export async function initializePatientNutrition(
  storeId: string,
  patientId: string,
  payload: PatientNutritionInitPayload,
): Promise<PatientNutritionInitiationApiItem> {
  const res = await clinicaFetch<{ data: PatientNutritionInitiationApiItem }>(
    storeId,
    `/v1/patients/${patientId}/treatments/${payload.treatmentId}/nutrition-init`,
    {
      method: 'POST',
      body: JSON.stringify({
        professionalId: payload.professionalId,
        professionalName: payload.professionalName,
        initiatedAt: payload.initiatedAt,
        anamnesis: payload.anamnesis,
        body: payload.body,
        treatmentPlan: payload.treatmentPlan,
      }),
    },
  );

  return res.data;
}

export async function listPatientNutritionInitiations(
  storeId: string,
  patientId: string,
): Promise<PatientNutritionInitiationSummaryApiItem[]> {
  const res = await clinicaFetch<{
    data: PatientNutritionInitiationSummaryApiItem[];
  }>(storeId, `/v1/patients/${patientId}/nutrition-inits`);

  return res.data;
}

export async function getPatientNutritionInitiation(
  storeId: string,
  patientId: string,
  evolutionId: string,
): Promise<PatientNutritionInitiationApiItem> {
  const res = await clinicaFetch<{ data: PatientNutritionInitiationApiItem }>(
    storeId,
    `/v1/patients/${patientId}/nutrition-inits/${evolutionId}`,
  );

  return res.data;
}
