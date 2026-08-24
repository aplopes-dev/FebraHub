import { clinicaFetch } from '@/features/clinic/shared/api';
import type {
  ExternalReferralProfessional,
  ExternalReferralProfessionalInput,
} from '../types/external-referral-professional';

type ExternalProfessionalApiItem = {
  id: string;
  name: string;
  phone: string;
  cro: string;
  createdAt: string;
  updatedAt: string;
};

type ListEnvelope = { data: ExternalProfessionalApiItem[] };
type ItemEnvelope = { data: ExternalProfessionalApiItem };

function toExternalProfessional(
  row: ExternalProfessionalApiItem,
): ExternalReferralProfessional {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    cro: row.cro,
  };
}

export async function listPatientExternalProfessionals(
  storeId: string,
): Promise<ExternalReferralProfessional[]> {
  const res = await clinicaFetch<ListEnvelope>(
    storeId,
    '/v1/patient-external-professionals',
  );
  return res.data.map(toExternalProfessional);
}

export async function createPatientExternalProfessional(
  storeId: string,
  input: ExternalReferralProfessionalInput,
): Promise<ExternalReferralProfessional> {
  const res = await clinicaFetch<ItemEnvelope>(
    storeId,
    '/v1/patient-external-professionals',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return toExternalProfessional(res.data);
}

export async function updatePatientExternalProfessional(
  storeId: string,
  id: string,
  input: ExternalReferralProfessionalInput,
): Promise<ExternalReferralProfessional> {
  const res = await clinicaFetch<ItemEnvelope>(
    storeId,
    `/v1/patient-external-professionals/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
  return toExternalProfessional(res.data);
}

export async function deletePatientExternalProfessional(
  storeId: string,
  id: string,
): Promise<void> {
  await clinicaFetch(storeId, `/v1/patient-external-professionals/${id}`, {
    method: 'DELETE',
  });
}
