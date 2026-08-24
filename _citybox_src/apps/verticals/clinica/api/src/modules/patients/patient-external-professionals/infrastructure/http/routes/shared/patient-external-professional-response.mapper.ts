import type { ExternalReferralProfessional } from '../../../../domain/entities/external-referral-professional.entity';

export function toPatientExternalProfessionalResponse(
  professional: ExternalReferralProfessional,
) {
  return {
    id: professional.id,
    name: professional.name,
    phone: professional.phone,
    cro: professional.cro,
    createdAt: professional.createdAt.toISOString(),
    updatedAt: professional.updatedAt.toISOString(),
  };
}
