import type { ExternalReferralProfessional } from '../entities/external-referral-professional.entity';

export abstract class ExternalReferralProfessionalRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<ExternalReferralProfessional | null>;
  abstract findByName(
    storeId: string,
    name: string,
  ): Promise<ExternalReferralProfessional | null>;
  abstract findAll(storeId: string): Promise<ExternalReferralProfessional[]>;
  abstract save(
    professional: ExternalReferralProfessional,
  ): Promise<ExternalReferralProfessional>;
  abstract delete(storeId: string, id: string): Promise<void>;
}
