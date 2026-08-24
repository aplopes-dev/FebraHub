import type { PatientReferralOrigin } from '../entities/patient-referral-origin.entity';
import type { PatientReferralOriginSystemKey } from '../entities/patient-referral-origin.entity';

export abstract class PatientReferralOriginRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<PatientReferralOrigin | null>;
  abstract findByName(
    storeId: string,
    name: string,
  ): Promise<PatientReferralOrigin | null>;
  abstract findBySystemKey(
    storeId: string,
    systemKey: PatientReferralOriginSystemKey,
  ): Promise<PatientReferralOrigin | null>;
  abstract findAll(storeId: string): Promise<PatientReferralOrigin[]>;
  abstract save(
    origin: PatientReferralOrigin,
  ): Promise<PatientReferralOrigin>;
  abstract saveMany(
    origins: readonly PatientReferralOrigin[],
  ): Promise<PatientReferralOrigin[]>;
}
