import { BadRequestException } from '@nestjs/common';
import { Patient } from '../../../../patients/domain/entities/patient.entity';
import { InMemoryPatientRepository } from '../../../../patients/tests/in-memory-patient.repository';
import { GetDashboardPatientAcquisitionUseCase } from './get-dashboard-patient-acquisition.use-case';

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const IDS = {
  p1: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  p2: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  p3: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  p4: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
  p5: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
} as const;

describe('GetDashboardPatientAcquisitionUseCase', () => {
  const storeId = '11111111-1111-1111-1111-111111111111';
  const otherStoreId = '22222222-2222-2222-2222-222222222222';

  function createUseCase() {
    const patientRepo = new InMemoryPatientRepository();
    patientRepo.seedCategory(CATEGORY_ID, {
      name: 'Particular',
      colorId: '#3b82f6',
    });
    return {
      patientRepo,
      useCase: new GetDashboardPatientAcquisitionUseCase(patientRepo),
    };
  }


  function seedPatient(
    repo: InMemoryPatientRepository,
    input: {
      id: string;
      storeId?: string;
      name?: string;
      referralOriginSystemKey?: string | null;
      createdAt: Date;
      status?: 'active' | 'inactive';
    },
  ) {
    const systemKey = input.referralOriginSystemKey ?? null;
    let referralOriginId: string | null = null;
    if (systemKey) {
      const originIds: Record<string, string> = {
        facebook: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
        instagram: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
        google: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
        indicacao: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
        indicacao_profissional: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5',
        indicacao_profissional_externo: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7',
        outro: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6',
      };
      referralOriginId = originIds[systemKey] ?? null;
      if (referralOriginId) {
        repo.seedReferralOrigin(referralOriginId, {
          name: systemKey,
          systemKey: systemKey as any,
        });
      }
    }
    repo.seedPatient(
      Patient.create(
        {
          storeId: input.storeId ?? storeId,
          status: input.status ?? 'active',
          name: input.name ?? 'Paciente',
          gender: 'female',
          categoryId: CATEGORY_ID,
          referralOriginId,
          createdAt: input.createdAt,
        },
        input.id,
      ),
    );
  }

  it('requires month when periodMode is monthly', async () => {
    const { useCase } = createUseCase();
    await expect(
      useCase.execute({
        storeId,
        periodMode: 'monthly',
        year: 2026,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aggregates by referralSource with null as nao_informado and percent', async () => {
    const { patientRepo, useCase } = createUseCase();

    seedPatient(patientRepo, {
      id: IDS.p1,
      referralOriginSystemKey: 'facebook',
      createdAt: new Date('2026-07-10T12:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p2,
      referralOriginSystemKey: 'facebook',
      createdAt: new Date('2026-07-11T12:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p3,
      referralOriginSystemKey: null,
      createdAt: new Date('2026-07-12T12:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p4,
      referralOriginSystemKey: 'indicacao',
      createdAt: new Date('2026-07-13T12:00:00.000Z'),
      status: 'inactive',
    });
    // fora do mês
    seedPatient(patientRepo, {
      id: IDS.p5,
      referralOriginSystemKey: 'google',
      createdAt: new Date('2026-06-01T12:00:00.000Z'),
    });

    const result = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });

    expect(result.totalCount).toBe(4);
    expect(result.aggregates).toEqual([
      {
        source: 'facebook',
        label: 'Facebook',
        count: 2,
        percent: 50,
      },
      {
        source: 'indicacao',
        label: 'Indicado por outro paciente',
        count: 1,
        percent: 25,
      },
      {
        source: 'nao_informado',
        label: 'Não informado',
        count: 1,
        percent: 25,
      },
    ]);
  });

  it('filters annual period and isolates store', async () => {
    const { patientRepo, useCase } = createUseCase();

    seedPatient(patientRepo, {
      id: IDS.p1,
      referralOriginSystemKey: 'instagram',
      createdAt: new Date('2026-01-15T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p2,
      referralOriginSystemKey: 'instagram',
      createdAt: new Date('2025-12-31T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p3,
      storeId: otherStoreId,
      referralOriginSystemKey: 'instagram',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
    });

    const result = await useCase.execute({
      storeId,
      periodMode: 'annual',
      year: 2026,
    });

    expect(result.totalCount).toBe(1);
    expect(result.aggregates).toEqual([
      {
        source: 'instagram',
        label: 'Instagram',
        count: 1,
        percent: 100,
      },
    ]);
  });

  it('returns distinct acquisition years descending', async () => {
    const { patientRepo, useCase } = createUseCase();

    seedPatient(patientRepo, {
      id: IDS.p1,
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
      referralOriginSystemKey: 'google',
    });
    seedPatient(patientRepo, {
      id: IDS.p2,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      referralOriginSystemKey: 'google',
    });
    seedPatient(patientRepo, {
      id: IDS.p3,
      createdAt: new Date('2025-06-01T00:00:00.000Z'),
      referralOriginSystemKey: 'google',
    });

    const result = await useCase.execute({
      storeId,
      periodMode: 'annual',
      year: 2026,
    });

    expect(result.years).toEqual([2026, 2025, 2024]);
  });
});
