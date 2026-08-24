import { UpsertClinicProfileUseCase } from './upsert-clinic-profile.use-case';
import { GetClinicProfileUseCase } from '../get-clinic-profile/get-clinic-profile.use-case';
import { InMemoryClinicStoreProfileRepository } from '../../../tests/in-memory-clinic-store-profile.repository';
import { ClinicStoreProfile } from '../../../domain/entities/clinic-store-profile.entity';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('UpsertClinicProfileUseCase', () => {
  let upsertUseCase: UpsertClinicProfileUseCase;
  let getUseCase: GetClinicProfileUseCase;
  let repository: InMemoryClinicStoreProfileRepository;

  beforeEach(() => {
    repository = new InMemoryClinicStoreProfileRepository();
    upsertUseCase = new UpsertClinicProfileUseCase(repository);
    getUseCase = new GetClinicProfileUseCase(repository);
  });

  it('creates profile on first save and updates on subsequent save', async () => {
    const defaults = await getUseCase.execute({ storeId: STORE_ID });
    expect(defaults).toBeInstanceOf(ClinicStoreProfile);
    expect(defaults.clinicName).toBe('');
    expect(defaults.openingTime).toBe('08:00');

    const created = await upsertUseCase.execute({
      storeId: STORE_ID,
      clinicName: 'Clínica Ilhéus',
      cnpj: '04.252.011/0001-10',
      communicationsName: 'Clínica Ilhéus',
      responsible: 'Dr. Silva',
      openingTime: '09:00',
      closingTime: '17:00',
      email: 'contato@clinica.com',
      phone: '7332110000',
      mobile: '73999990000',
      cep: '45650000',
      street: 'Rua das Flores',
      number: '100',
      complement: 'Sala 2',
      neighborhood: 'Centro',
      city: 'Ilhéus',
      state: 'BA',
    });

    expect(created.clinicName).toBe('Clínica Ilhéus');
    expect(created.state).toBe('BA');

    const updated = await upsertUseCase.execute({
      storeId: STORE_ID,
      clinicName: 'Clínica Ilhéus Atualizada',
      cnpj: '04.252.011/0001-10',
      communicationsName: 'Clínica Ilhéus',
      responsible: 'Dr. Silva',
      openingTime: '08:30',
      closingTime: '18:30',
      email: 'contato@clinica.com',
      phone: '7332110000',
      mobile: '73999990000',
      cep: '45650000',
      street: 'Rua das Flores',
      number: '100',
      complement: 'Sala 2',
      neighborhood: 'Centro',
      city: 'Ilhéus',
      state: 'BA',
    });

    expect(updated.clinicName).toBe('Clínica Ilhéus Atualizada');
    expect(updated.openingTime).toBe('08:30');

    const persisted = await repository.findByStoreId(STORE_ID);
    expect(persisted?.clinicName).toBe('Clínica Ilhéus Atualizada');
  });
});
