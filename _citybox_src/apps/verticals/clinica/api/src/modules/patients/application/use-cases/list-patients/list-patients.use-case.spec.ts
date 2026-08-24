import { ListPatientsUseCase } from './list-patients.use-case';
import {
  CATEGORY_A,
  STORE_A,
  VALID_CPF,
  createPatientsTestHarness,
} from '../../../tests/patients-test.fixtures';

describe('ListPatientsUseCase', () => {
  it('searches by partial name', async () => {
    const { patientRepo, createPatient } = createPatientsTestHarness();
    const listPatients = new ListPatientsUseCase(patientRepo);

    await createPatient.execute({
      storeId: STORE_A,
      input: {
        name: 'Bruno Santos',
        gender: 'male',
        cpf: VALID_CPF,
        phone: '73999887766',
        categoryId: CATEGORY_A,
      },
    });

    const byName = await listPatients.execute({
      storeId: STORE_A,
      search: 'bruno',
    });

    expect(byName.items).toHaveLength(1);
    expect(byName.items[0]?.patient.name).toBe('Bruno Santos');
  });

  it('searches by exact CPF digits', async () => {
    const { patientRepo, createPatient } = createPatientsTestHarness();
    const listPatients = new ListPatientsUseCase(patientRepo);

    await createPatient.execute({
      storeId: STORE_A,
      input: {
        name: 'Bruno Santos',
        gender: 'male',
        cpf: VALID_CPF,
        phone: '73999887766',
        categoryId: CATEGORY_A,
      },
    });

    const byCpf = await listPatients.execute({
      storeId: STORE_A,
      search: VALID_CPF,
    });

    expect(byCpf.items).toHaveLength(1);
  });

  it('searches by formatted CPF', async () => {
    const { patientRepo, createPatient } = createPatientsTestHarness();
    const listPatients = new ListPatientsUseCase(patientRepo);

    await createPatient.execute({
      storeId: STORE_A,
      input: {
        name: 'Bruno Santos',
        gender: 'male',
        cpf: VALID_CPF,
        categoryId: CATEGORY_A,
      },
    });

    const byFormattedCpf = await listPatients.execute({
      storeId: STORE_A,
      search: '529.982.247-25',
    });

    expect(byFormattedCpf.items).toHaveLength(1);
  });

  it('searches by exact phone digits', async () => {
    const { patientRepo, createPatient } = createPatientsTestHarness();
    const listPatients = new ListPatientsUseCase(patientRepo);

    await createPatient.execute({
      storeId: STORE_A,
      input: {
        name: 'Bruno Santos',
        gender: 'male',
        cpf: VALID_CPF,
        phone: '73999887766',
        categoryId: CATEGORY_A,
      },
    });

    const byPhone = await listPatients.execute({
      storeId: STORE_A,
      search: '73999887766',
    });

    expect(byPhone.items).toHaveLength(1);
  });

  it('paginates patients', async () => {
    const { patientRepo, createPatient } = createPatientsTestHarness();
    const listPatients = new ListPatientsUseCase(patientRepo);

    for (let i = 0; i < 3; i += 1) {
      await createPatient.execute({
        storeId: STORE_A,
        input: {
          name: `Paciente ${i}`,
          gender: 'other',
          categoryId: CATEGORY_A,
        },
      });
    }

    const page1 = await listPatients.execute({
      storeId: STORE_A,
      page: 1,
      perPage: 2,
    });

    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(3);
    expect(page1.totalPages).toBe(2);
  });
});
