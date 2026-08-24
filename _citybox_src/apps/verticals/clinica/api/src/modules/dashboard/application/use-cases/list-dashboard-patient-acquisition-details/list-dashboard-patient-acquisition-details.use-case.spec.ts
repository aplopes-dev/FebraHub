import { Patient } from '../../../../patients/domain/entities/patient.entity';
import { InMemoryPatientRepository } from '../../../../patients/tests/in-memory-patient.repository';
import { ListDashboardPatientAcquisitionDetailsUseCase } from './list-dashboard-patient-acquisition-details.use-case';

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const storeId = '11111111-1111-1111-1111-111111111111';
const IDS = {
  p1: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  p2: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  p3: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
  p4: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
} as const;

describe('ListDashboardPatientAcquisitionDetailsUseCase', () => {
  function createUseCase() {
    const patientRepo = new InMemoryPatientRepository();
    patientRepo.seedCategory(CATEGORY_ID, {
      name: 'Particular',
      colorId: '#3b82f6',
    });
    return {
      patientRepo,
      useCase: new ListDashboardPatientAcquisitionDetailsUseCase(patientRepo),
    };
  }


  function seedPatient(
    repo: InMemoryPatientRepository,
    input: {
      id: string;
      storeId?: string;
      name?: string;
      phone?: string;
      email?: string;
      cpf?: string | null;
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
          phone: input.phone ?? '',
          email: input.email ?? '',
          cpf: input.cpf ?? null,
          createdAt: input.createdAt,
        },
        input.id,
      ),
    );
  }

  it('lists only the requested source with pagination', async () => {
    const { patientRepo, useCase } = createUseCase();

    seedPatient(patientRepo, {
      id: IDS.p1,
      name: 'Ana',
      referralOriginSystemKey: 'facebook',
      createdAt: new Date('2026-07-10T12:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p2,
      name: 'Bia',
      referralOriginSystemKey: 'facebook',
      createdAt: new Date('2026-07-11T12:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p3,
      name: 'Carla',
      referralOriginSystemKey: 'google',
      createdAt: new Date('2026-07-12T12:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p4,
      name: 'Diana',
      referralOriginSystemKey: null,
      createdAt: new Date('2026-07-13T12:00:00.000Z'),
    });

    const page1 = await useCase.execute({
      storeId,
      source: 'facebook',
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      page: 1,
      perPage: 1,
    });

    expect(page1.total).toBe(2);
    expect(page1.totalPages).toBe(2);
    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]?.name).toBe('Bia');
    expect(page1.items[0]?.referralSource).toBe('facebook');
    expect(page1.items[0]?.registeredAt).toBe('2026-07-11');

    const naoInformado = await useCase.execute({
      storeId,
      source: 'nao_informado',
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });

    expect(naoInformado.total).toBe(1);
    expect(naoInformado.items[0]?.name).toBe('Diana');
    expect(naoInformado.items[0]?.referralSource).toBe('nao_informado');
  });

  it('searches by name phone email or cpf', async () => {
    const { patientRepo, useCase } = createUseCase();

    seedPatient(patientRepo, {
      id: IDS.p1,
      name: 'Ana Silva',
      phone: '73999990001',
      email: 'ana@example.com',
      cpf: '52998224725',
      referralOriginSystemKey: 'instagram',
      createdAt: new Date('2026-07-10T12:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: IDS.p2,
      name: 'Bruno Costa',
      phone: '73999990002',
      email: 'bruno@example.com',
      referralOriginSystemKey: 'instagram',
      createdAt: new Date('2026-07-11T12:00:00.000Z'),
    });

    const byName = await useCase.execute({
      storeId,
      source: 'instagram',
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      search: 'ana',
    });
    expect(byName.total).toBe(1);
    expect(byName.items[0]?.id).toBe(IDS.p1);

    const byEmail = await useCase.execute({
      storeId,
      source: 'instagram',
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      search: 'bruno@',
    });
    expect(byEmail.total).toBe(1);
    expect(byEmail.items[0]?.id).toBe(IDS.p2);

    const byCpf = await useCase.execute({
      storeId,
      source: 'instagram',
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      search: '52998224725',
    });
    expect(byCpf.total).toBe(1);
    expect(byCpf.items[0]?.id).toBe(IDS.p1);
  });
});
