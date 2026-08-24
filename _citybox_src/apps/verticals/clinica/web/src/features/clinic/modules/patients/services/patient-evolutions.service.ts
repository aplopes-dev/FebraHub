import { clinicaFetch } from '@/features/clinic/shared/api';
import {
  toEvolutionHistoryEntry,
  toStandaloneEvolutionCreateBody,
  toStandaloneEvolutionUpdateBody,
  toTreatmentEvolution,
} from '../lib/patient-treatment-api-mappers';
import type {
  PatientStandaloneEvolutionPayload,
  PatientTreatmentEvolution,
  PatientTreatmentEvolutionHistoryEntry,
} from '../types/patient-treatment';
import type {
  TreatmentEvolutionApiItem,
  TreatmentEvolutionHistoryApiItem,
} from '../types/patient-treatment-api';

type EvolutionEnvelope = { data: TreatmentEvolutionApiItem };
type EvolutionListEnvelope = { data: TreatmentEvolutionApiItem[] };
type EvolutionHistoryEnvelope = { data: TreatmentEvolutionHistoryApiItem[] };

export async function listPatientEvolutions(
  storeId: string,
  patientId: string,
): Promise<PatientTreatmentEvolution[]> {
  const res = await clinicaFetch<EvolutionListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/evolutions`,
  );

  return res.data.map(toTreatmentEvolution);
}

export async function createPatientEvolution(
  storeId: string,
  patientId: string,
  payload: PatientStandaloneEvolutionPayload,
): Promise<PatientTreatmentEvolution> {
  const res = await clinicaFetch<EvolutionEnvelope>(
    storeId,
    `/v1/patients/${patientId}/evolutions`,
    {
      method: 'POST',
      body: JSON.stringify(toStandaloneEvolutionCreateBody(payload)),
    },
  );

  return toTreatmentEvolution(res.data);
}

export async function updatePatientEvolution(
  storeId: string,
  patientId: string,
  evolutionId: string,
  payload: PatientStandaloneEvolutionPayload,
): Promise<PatientTreatmentEvolution> {
  const res = await clinicaFetch<EvolutionEnvelope>(
    storeId,
    `/v1/patients/${patientId}/evolutions/${evolutionId}`,
    {
      method: 'PUT',
      body: JSON.stringify(toStandaloneEvolutionUpdateBody(payload)),
    },
  );

  return toTreatmentEvolution(res.data);
}

export async function deletePatientEvolution(
  storeId: string,
  patientId: string,
  evolutionId: string,
): Promise<void> {
  await clinicaFetch<void>(storeId, `/v1/patients/${patientId}/evolutions/${evolutionId}`, {
    method: 'DELETE',
  });
}

export async function getPatientEvolutionHistory(
  storeId: string,
  patientId: string,
  evolutionId: string,
): Promise<PatientTreatmentEvolutionHistoryEntry[]> {
  const res = await clinicaFetch<EvolutionHistoryEnvelope>(
    storeId,
    `/v1/patients/${patientId}/evolutions/${evolutionId}/history`,
  );

  return res.data.map(toEvolutionHistoryEntry);
}
