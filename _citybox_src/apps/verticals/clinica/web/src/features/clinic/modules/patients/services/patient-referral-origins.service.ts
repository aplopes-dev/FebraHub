import { clinicaFetch } from '@/features/clinic/shared/api';
import { toPatientReferralOrigin } from '../lib/patient-api-mappers';
import type {
  PatientReferralOrigin,
  PatientReferralOriginInput,
} from '../types/patient-referral-origin';
import type { PatientReferralOriginApiItem } from '../types/patient-api';

type PatientReferralOriginListEnvelope = { data: PatientReferralOriginApiItem[] };
type PatientReferralOriginEnvelope = { data: PatientReferralOriginApiItem };

export async function listPatientReferralOrigins(
  storeId: string,
): Promise<PatientReferralOrigin[]> {
  const res = await clinicaFetch<PatientReferralOriginListEnvelope>(
    storeId,
    '/v1/patient-referral-origins',
  );
  return res.data.map(toPatientReferralOrigin);
}

export async function createPatientReferralOrigin(
  storeId: string,
  input: PatientReferralOriginInput,
): Promise<PatientReferralOrigin> {
  const res = await clinicaFetch<PatientReferralOriginEnvelope>(
    storeId,
    '/v1/patient-referral-origins',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return toPatientReferralOrigin(res.data);
}
