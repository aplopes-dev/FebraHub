import type { PatientReferralOrigin } from '../../../../domain/entities/patient-referral-origin.entity';

export function toPatientReferralOriginResponse(
  origin: PatientReferralOrigin,
) {
  return {
    id: origin.id,
    name: origin.name,
    systemKey: origin.systemKey,
    isSystem: origin.isSystem,
    createdAt: origin.createdAt.toISOString(),
    updatedAt: origin.updatedAt.toISOString(),
  };
}
