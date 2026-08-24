import { CreatePatientExternalProfessionalUseCase } from './create-patient-external-professional.use-case';
import { InMemoryExternalReferralProfessionalRepository } from '../../../tests/in-memory-external-referral-professional.repository';
import { ExternalReferralProfessionalNameTakenError } from '../../../domain/errors/external-referral-professional-name-taken.error';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';

const STORE = '11111111-1111-4111-8111-111111111111';

describe('CreatePatientExternalProfessionalUseCase', () => {
  it('creates a professional with trimmed name and digit phone', async () => {
    const repo = new InMemoryExternalReferralProfessionalRepository();
    const useCase = new CreatePatientExternalProfessionalUseCase(repo);

    const professional = await useCase.execute({
      storeId: STORE,
      name: '  Dr. Silva  ',
      phone: '(73) 99999-8888',
      cro: 'BA-1234',
    });

    expect(professional.name).toBe('Dr. Silva');
    expect(professional.phone).toBe('73999998888');
    expect(professional.cro).toBe('BA-1234');
  });

  it('rejects empty name', async () => {
    const repo = new InMemoryExternalReferralProfessionalRepository();
    const useCase = new CreatePatientExternalProfessionalUseCase(repo);

    await expect(
      useCase.execute({ storeId: STORE, name: '   ' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects duplicate name in the same store', async () => {
    const repo = new InMemoryExternalReferralProfessionalRepository();
    const useCase = new CreatePatientExternalProfessionalUseCase(repo);

    await useCase.execute({ storeId: STORE, name: 'Dr. Silva' });

    await expect(
      useCase.execute({ storeId: STORE, name: 'dr. silva' }),
    ).rejects.toBeInstanceOf(ExternalReferralProfessionalNameTakenError);
  });
});
