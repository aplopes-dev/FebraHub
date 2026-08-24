import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ClinicPlan, ClinicPlanStatus } from '../plans/types/clinic-plan';
import type { ClinicPlanTreatmentInit } from '../plans/types/clinic-plan-form';
import type { PlanSpecialtyItem } from '../plans/types/clinic-plan-specialty';
import { defaultLocationUiTypeForSpecialtyName } from '../plans/data/specialty-location-ui-type';

type ClinicPlanSummaryApi = {
  id: string;
  name: string;
  order: number;
  status: ClinicPlanStatus;
  isDefault: boolean;
  treatmentInit?: ClinicPlanTreatmentInit;
};

type ClinicPlanDetailApi = ClinicPlanSummaryApi & {
  specialties: PlanSpecialtyItem[];
};

type ClinicPlanListEnvelope = { data: ClinicPlanSummaryApi[] };
type ClinicPlanDetailEnvelope = { data: ClinicPlanDetailApi };
type ClinicPlanSummaryEnvelope = { data: ClinicPlanSummaryApi };

export type ClinicPlanUpsertPayload = {
  name: string;
  status: ClinicPlanStatus;
  isDefault: boolean;
  treatmentInit?: ClinicPlanTreatmentInit;
  specialties: PlanSpecialtyItem[];
};

function toClinicPlan(
  summary: ClinicPlanSummaryApi,
  specialties: PlanSpecialtyItem[] = [],
): ClinicPlan {
  return {
    id: summary.id,
    name: summary.name,
    order: summary.order,
    status: summary.status,
    isDefault: summary.isDefault,
    treatmentInit: summary.treatmentInit,
    specialties: specialties.map((specialty) => ({
      ...specialty,
      locationUiType:
        specialty.locationUiType ??
        defaultLocationUiTypeForSpecialtyName(specialty.name),
      treatments: specialty.treatments.map((treatment) => ({
        ...treatment,
        acceptsFaces: treatment.acceptsFaces === true,
        locationUiType: treatment.locationUiType ?? null,
      })),
    })),
  };
}

function toApiSpecialties(specialties: PlanSpecialtyItem[]) {
  return specialties.map((specialty) => ({
    id: specialty.id,
    name: specialty.name,
    locationUiType:
      specialty.locationUiType ??
      defaultLocationUiTypeForSpecialtyName(specialty.name),
    treatments: specialty.treatments.map((treatment) => ({
      id: treatment.id,
      name: treatment.name,
      treatmentValue: treatment.treatmentValue,
      treatmentCost: treatment.treatmentCost,
      enabled: treatment.enabled,
      acceptsFaces: treatment.acceptsFaces === true,
      ...(treatment.locationUiType
        ? { locationUiType: treatment.locationUiType }
        : {}),
    })),
  }));
}

function toCreateBody(payload: ClinicPlanUpsertPayload) {
  return {
    name: payload.name,
    status: payload.status,
    isDefault: payload.isDefault,
    treatmentInit: payload.treatmentInit,
    specialties: toApiSpecialties(payload.specialties),
  };
}

function toUpdateBody(payload: Omit<ClinicPlanUpsertPayload, 'treatmentInit'>) {
  return {
    name: payload.name,
    status: payload.status,
    isDefault: payload.isDefault,
    specialties: toApiSpecialties(payload.specialties),
  };
}

export async function listClinicPlans(storeId: string): Promise<ClinicPlan[]> {
  const res = await clinicaFetch<ClinicPlanListEnvelope>(storeId, '/v1/clinic-plans');
  return res.data.map((plan) => toClinicPlan(plan));
}

export async function getClinicPlanById(storeId: string, planId: string): Promise<ClinicPlan> {
  const res = await clinicaFetch<ClinicPlanDetailEnvelope>(
    storeId,
    `/v1/clinic-plans/${planId}`,
  );
  return toClinicPlan(res.data, res.data.specialties);
}

export async function createClinicPlan(
  storeId: string,
  payload: ClinicPlanUpsertPayload,
): Promise<ClinicPlan> {
  const res = await clinicaFetch<ClinicPlanDetailEnvelope>(storeId, '/v1/clinic-plans', {
    method: 'POST',
    body: JSON.stringify(toCreateBody(payload)),
  });
  return toClinicPlan(res.data, res.data.specialties);
}

export async function updateClinicPlan(
  storeId: string,
  planId: string,
  payload: Omit<ClinicPlanUpsertPayload, 'treatmentInit'>,
): Promise<ClinicPlan> {
  const res = await clinicaFetch<ClinicPlanDetailEnvelope>(
    storeId,
    `/v1/clinic-plans/${planId}`,
    {
      method: 'PUT',
      body: JSON.stringify(toUpdateBody(payload)),
    },
  );
  return toClinicPlan(res.data, res.data.specialties);
}

export async function updateClinicPlanStatus(
  storeId: string,
  planId: string,
  active: boolean,
): Promise<ClinicPlan> {
  const res = await clinicaFetch<ClinicPlanSummaryEnvelope>(
    storeId,
    `/v1/clinic-plans/${planId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    },
  );
  return toClinicPlan(res.data);
}

export async function deleteClinicPlan(storeId: string, planId: string): Promise<void> {
  await clinicaFetch<void>(storeId, `/v1/clinic-plans/${planId}`, {
    method: 'DELETE',
  });
}
