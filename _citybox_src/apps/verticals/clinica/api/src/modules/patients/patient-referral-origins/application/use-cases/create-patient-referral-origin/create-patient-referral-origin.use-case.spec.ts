import { CreatePatientReferralOriginUseCase } from './create-patient-referral-origin.use-case';
import { InMemoryPatientReferralOriginRepository } from '../../../tests/in-memory-patient-referral-origin.repository';
import { PatientReferralOriginNameTakenError } from '../../../domain/errors/patient-referral-origin-name-taken.error';
import { ListPatientReferralOriginsUseCase } from '../list-patient-referral-origins/list-patient-referral-origins.use-case';

const STORE = '11111111-1111-4111-8111-111111111111';

describe('CreatePatientReferralOriginUseCase', () => {
  it('creates a custom origin', async () => {
    const repo = new InMemoryPatientReferralOriginRepository();
    const useCase = new CreatePatientReferralOriginUseCase(repo);

    const origin = await useCase.execute({
      storeId: STORE,
      name: '  Outdoor  ',
    });

    expect(origin.name).toBe('Outdoor');
    expect(origin.isSystem).toBe(false);
    expect(origin.systemKey).toBeNull();
  });

  it('rejects duplicate custom name and system name clash', async () => {
    const repo = new InMemoryPatientReferralOriginRepository();
    const list = new ListPatientReferralOriginsUseCase(repo);
    await list.execute({ storeId: STORE });
    const useCase = new CreatePatientReferralOriginUseCase(repo);

    await useCase.execute({ storeId: STORE, name: 'Outdoor' });

    await expect(
      useCase.execute({ storeId: STORE, name: 'outdoor' }),
    ).rejects.toBeInstanceOf(PatientReferralOriginNameTakenError);

    await expect(
      useCase.execute({ storeId: STORE, name: 'Google' }),
    ).rejects.toBeInstanceOf(PatientReferralOriginNameTakenError);
  });
});
