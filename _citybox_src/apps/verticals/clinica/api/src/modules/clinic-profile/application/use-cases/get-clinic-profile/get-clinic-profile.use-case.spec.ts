import { GetClinicProfileUseCase } from './get-clinic-profile.use-case';
import { UpsertClinicProfileUseCase } from '../upsert-clinic-profile/upsert-clinic-profile.use-case';
import { InMemoryClinicStoreProfileRepository } from '../../../tests/in-memory-clinic-store-profile.repository';
import { ClinicStoreProfile } from '../../../domain/entities/clinic-store-profile.entity';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('GetClinicProfileUseCase', () => {
  let getUseCase: GetClinicProfileUseCase;
  let upsertUseCase: UpsertClinicProfileUseCase;
  let repository: InMemoryClinicStoreProfileRepository;

  beforeEach(() => {
    repository = new InMemoryClinicStoreProfileRepository();
    getUseCase = new GetClinicProfileUseCase(repository);
    upsertUseCase = new UpsertClinicProfileUseCase(repository);
  });

  it('returns defaults when profile does not exist', async () => {
    const profile = await getUseCase.execute({ storeId: STORE_ID });

    expect(profile).toBeInstanceOf(ClinicStoreProfile);
    expect(profile.storeId).toBe(STORE_ID);
    expect(profile.clinicName).toBe('');
    expect(profile.openingTime).toBe('08:00');
    expect(profile.closingTime).toBe('18:00');
  });

  it('returns persisted profile when it exists', async () => {
    await upsertUseCase.execute({
      storeId: STORE_ID,
      clinicName: 'Clínica Centro',
      cnpj: '04.252.011/0001-10',
      communicationsName: 'Clínica Centro',
      responsible: 'Dra. Ana',
      openingTime: '07:00',
      closingTime: '19:00',
      email: 'ana@clinica.com',
      phone: '7332110000',
      mobile: '73999990000',
      cep: '45650000',
      street: 'Av. Principal',
      number: '50',
      complement: '',
      neighborhood: 'Centro',
      city: 'Ilhéus',
      state: 'BA',
    });

    const profile = await getUseCase.execute({ storeId: STORE_ID });

    expect(profile.clinicName).toBe('Clínica Centro');
    expect(profile.openingTime).toBe('07:00');
  });
});
