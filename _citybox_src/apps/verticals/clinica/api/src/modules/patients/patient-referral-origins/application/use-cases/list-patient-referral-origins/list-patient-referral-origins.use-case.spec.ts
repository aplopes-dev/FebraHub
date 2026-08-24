import { ListPatientReferralOriginsUseCase } from './list-patient-referral-origins.use-case';
import { InMemoryPatientReferralOriginRepository } from '../../../tests/in-memory-patient-referral-origin.repository';
import { SYSTEM_REFERRAL_ORIGINS } from '../../../domain/entities/patient-referral-origin.entity';

const STORE = '11111111-1111-4111-8111-111111111111';

describe('ListPatientReferralOriginsUseCase', () => {
  it('seeds missing system origins then lists all', async () => {
    const repo = new InMemoryPatientReferralOriginRepository();
    const useCase = new ListPatientReferralOriginsUseCase(repo);

    const first = await useCase.execute({ storeId: STORE });
    expect(first).toHaveLength(SYSTEM_REFERRAL_ORIGINS.length);
    expect(first.every((item) => item.isSystem)).toBe(true);

    const second = await useCase.execute({ storeId: STORE });
    expect(second).toHaveLength(SYSTEM_REFERRAL_ORIGINS.length);
  });
});
