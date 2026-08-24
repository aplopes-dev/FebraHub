'use client';

import { useQuery } from '@tanstack/react-query';
import { getPatientById, listPatients } from '@/features/clinic/modules/patients/services/patients.service';
import { useStore } from '@/lib/store-context';

export interface PatientSimple {
  id: string;
  name: string;
  phone: string | null;
  avatar: string | null;
}

export interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  planName: string | null;
}

export async function searchPatientsSimple(
  storeId: string,
  query?: string,
): Promise<PatientSimple[]> {
  const term = (query ?? '').trim();
  if (!term) return [];

  const { items } = await listPatients(storeId, {
    search: term,
    perPage: 20,
    page: 1,
    status: 'active',
  });

  return items.map((patient) => ({
    id: patient.id,
    name: patient.name,
    phone: patient.phone || null,
    avatar: patient.photoUrl ?? null,
  }));
}

export async function getPatient(storeId: string, id: string): Promise<Patient> {
  const { patient } = await getPatientById(storeId, id);
  return {
    id: patient.id,
    name: patient.name,
    phone: patient.phone || null,
    email: patient.email || null,
    avatar: patient.photoUrl ?? null,
    planName: patient.planName || null,
  };
}

/** @deprecated Use funções nomeadas — mantido para compatibilidade. */
export const patientsService = {
  searchSimple: searchPatientsSimple,
  get: getPatient,
};

export function usePatient(id: string | undefined) {
  const { storeId } = useStore();

  return useQuery<Patient, Error>({
    queryKey: ['schedule', 'patients', storeId ?? '', id],
    queryFn: () => getPatient(storeId!, id!),
    enabled: Boolean(storeId) && Boolean(id),
  });
}
