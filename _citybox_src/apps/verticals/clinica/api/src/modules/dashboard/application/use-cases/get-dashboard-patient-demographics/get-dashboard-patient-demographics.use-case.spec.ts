import { Patient } from '../../../../patients/domain/entities/patient.entity';
import { InMemoryPatientRepository } from '../../../../patients/tests/in-memory-patient.repository';
import { GetDashboardPatientDemographicsUseCase } from './get-dashboard-patient-demographics.use-case';

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const IDS = {
  p1: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  p2: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
  p3: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
  p4: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4',
  p5: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5',
  p6: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc6',
} as const;

describe('GetDashboardPatientDemographicsUseCase', () => {
  const storeId = '11111111-1111-1111-1111-111111111111';
  const otherStoreId = '22222222-2222-2222-2222-222222222222';
  const now = new Date('2026-07-20T12:00:00.000Z');

  function createUseCase() {
    const patientRepo = new InMemoryPatientRepository();
    patientRepo.seedCategory(CATEGORY_ID, {
      name: 'Particular',
      colorId: '#3b82f6',
    });
    return {
      patientRepo,
      useCase: new GetDashboardPatientDemographicsUseCase(patientRepo),
    };
  }

  function seedPatient(
    repo: InMemoryPatientRepository,
    input: {
      id: string;
      storeId?: string;
      status?: 'active' | 'inactive';
      gender: Patient['gender'];
      birthDate: Date | null;
    },
  ) {
    repo.seedPatient(
      Patient.create(
        {
          storeId: input.storeId ?? storeId,
          status: input.status ?? 'active',
          name: 'Paciente',
          gender: input.gender,
          categoryId: CATEGORY_ID,
          birthDate: input.birthDate,
        },
        input.id,
      ),
    );
  }

  it('aggregates age series and gender shares; maps other to uninformed', async () => {
    const { patientRepo, useCase } = createUseCase();

    seedPatient(patientRepo, {
      id: IDS.p1,
      gender: 'female',
      birthDate: new Date('1995-03-12T00:00:00.000Z'), // 31
    });
    seedPatient(patientRepo, {
      id: IDS.p2,
      gender: 'male',
      birthDate: new Date('1988-07-20T00:00:00.000Z'), // 38
    });
    seedPatient(patientRepo, {
      id: IDS.p3,
      gender: 'other',
      birthDate: null,
    });
    seedPatient(patientRepo, {
      id: IDS.p4,
      gender: 'female',
      birthDate: new Date('1920-01-01T00:00:00.000Z'), // 100+
    });
    // inactive — fora do universo
    seedPatient(patientRepo, {
      id: IDS.p5,
      status: 'inactive',
      gender: 'male',
      birthDate: new Date('2000-01-01T00:00:00.000Z'),
    });

    const result = await useCase.execute({ storeId, now });

    expect(result.totalCount).toBe(4);
    expect(result.filteredTotalCount).toBe(4);
    expect(result.genderShares).toEqual([
      { gender: 'female', label: 'Feminino', count: 2, percent: 50 },
      { gender: 'male', label: 'Masculino', count: 1, percent: 25 },
      {
        gender: 'uninformed',
        label: 'Não informado',
        count: 1,
        percent: 25,
      },
    ]);
    expect(result.ageSeries).toEqual([
      {
        key: 'unknown',
        label: 'Idade não informado',
        count: 1,
        percent: 25,
      },
      { key: '0-9', label: '0 a 9 anos', count: 0, percent: 0 },
      { key: '10-19', label: '10 a 19 anos', count: 0, percent: 0 },
      { key: '20-29', label: '20 a 29 anos', count: 0, percent: 0 },
      { key: '30-39', label: '30 a 39 anos', count: 2, percent: 50 },
      { key: '40-49', label: '40 a 49 anos', count: 0, percent: 0 },
      { key: '50-59', label: '50 a 59 anos', count: 0, percent: 0 },
      { key: '60-69', label: '60 a 69 anos', count: 0, percent: 0 },
      { key: '70-79', label: '70 a 79 anos', count: 0, percent: 0 },
      { key: '80-89', label: '80 a 89 anos', count: 0, percent: 0 },
      { key: '90-99', label: '90 a 99 anos', count: 0, percent: 0 },
      {
        key: '100+',
        label: '100 anos ou mais',
        count: 1,
        percent: 25,
      },
    ]);
  });

  it('filters age series by gender while keeping genderShares on full base', async () => {
    const { patientRepo, useCase } = createUseCase();

    seedPatient(patientRepo, {
      id: IDS.p1,
      gender: 'female',
      birthDate: new Date('1995-03-12T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p2,
      gender: 'male',
      birthDate: new Date('1988-07-20T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p3,
      gender: 'female',
      birthDate: new Date('2001-01-01T00:00:00.000Z'),
    });

    const result = await useCase.execute({
      storeId,
      gender: 'female',
      now,
    });

    expect(result.totalCount).toBe(3);
    expect(result.filteredTotalCount).toBe(2);
    expect(result.ageSeries).toHaveLength(12);
    const withCount = result.ageSeries.filter((point) => point.count > 0);
    expect(withCount).toHaveLength(2);
    expect(withCount.every((point) => point.percent === 50)).toBe(true);
    expect(result.genderShares).toEqual([
      { gender: 'female', label: 'Feminino', count: 2, percent: 66.7 },
      { gender: 'male', label: 'Masculino', count: 1, percent: 33.3 },
    ]);
  });

  it('isolates store', async () => {
    const { patientRepo, useCase } = createUseCase();

    seedPatient(patientRepo, {
      id: IDS.p1,
      gender: 'female',
      birthDate: new Date('1995-03-12T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p2,
      storeId: otherStoreId,
      gender: 'male',
      birthDate: new Date('1988-07-20T00:00:00.000Z'),
    });

    const result = await useCase.execute({ storeId, now });

    expect(result.totalCount).toBe(1);
    expect(result.genderShares).toEqual([
      { gender: 'female', label: 'Feminino', count: 1, percent: 100 },
    ]);
  });
});
