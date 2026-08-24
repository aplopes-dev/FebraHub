import { clinicaFetch } from '@/features/clinic/shared/api';
import type { PatientBodyMetric } from '../types/patient-body-metric';

export type PatientBodyMetricApiItem = {
  id: string;
  patientId: string;
  measuredAt: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  professionalId: string;
  professionalName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PatientBodyMetricUpsertBody = {
  measuredAt: string;
  weightKg: number;
  heightCm: number;
  professionalId?: string;
  professionalName: string;
  notes?: string;
};

type MetricEnvelope = { data: PatientBodyMetricApiItem };
type MetricListEnvelope = {
  data: PatientBodyMetricApiItem[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
};

function toPatientBodyMetric(item: PatientBodyMetricApiItem): PatientBodyMetric {
  return {
    id: item.id,
    patientId: item.patientId,
    measuredAt: item.measuredAt,
    weightKg: item.weightKg,
    heightCm: item.heightCm,
    bmi: item.bmi,
    professionalId: item.professionalId || undefined,
    professionalName: item.professionalName,
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function listPatientBodyMetrics(
  storeId: string,
  patientId: string,
  params: { page?: number; perPage?: number } = {},
): Promise<{ items: PatientBodyMetric[]; meta: MetricListEnvelope['meta'] }> {
  const search = new URLSearchParams();
  search.set('page', String(params.page ?? 1));
  search.set('perPage', String(params.perPage ?? 10));
  search.set('sortBy', 'measuredAt');
  search.set('sortOrder', 'desc');

  const res = await clinicaFetch<MetricListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/body-metrics?${search.toString()}`,
  );

  return {
    items: res.data.map(toPatientBodyMetric),
    meta: res.meta,
  };
}

export async function createPatientBodyMetric(
  storeId: string,
  patientId: string,
  body: PatientBodyMetricUpsertBody,
): Promise<PatientBodyMetric> {
  const res = await clinicaFetch<MetricEnvelope>(
    storeId,
    `/v1/patients/${patientId}/body-metrics`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );

  return toPatientBodyMetric(res.data);
}

