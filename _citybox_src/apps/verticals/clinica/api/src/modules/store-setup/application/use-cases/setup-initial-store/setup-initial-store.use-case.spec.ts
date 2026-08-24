import { SetupInitialStoreUseCase } from './setup-initial-store.use-case';
import { UpsertClinicStoreUseCase } from '../upsert-clinic-store/upsert-clinic-store.use-case';
import { InMemoryClinicStoreRepository } from '../../../tests/in-memory-clinic-store.repository';
import { InMemoryStoreSetupLogRepository } from '../../../tests/in-memory-store-setup-log.repository';
import type { StorePlatformEventData } from '../../dtos/store-platform-event.dto';
import { CLINIC_SEED_TEMPLATE } from '../../seed-data/clinic-seed-template';
import type { ClinicStoreSeeder } from '../../clinic-store-seeder';
import type { StorePlatformEventOwnerData } from '../../dtos/store-platform-event.dto';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

const baseEvent: StorePlatformEventData = {
  storeId: STORE_ID,
  vertical: 'Clínica',
  tradeName: 'Clínica Demo',
  slug: 'clinica-demo',
  legalName: 'Clínica Demo Ltda',
  document: '11444777000161',
  stateRegistration: null,
  usesClientDocument: false,
  phone: '73999990000',
  timezone: 'America/Sao_Paulo',
  address: {
    zipCode: '45654-000',
    street: 'Rua das Flores',
    number: '100',
    neighborhood: 'Centro',
    city: 'Ilhéus',
    state: 'BA',
  },
  updatedAt: '2026-07-27T12:00:00.000Z',
};

function buildUseCase() {
  const clinicStoreRepo = new InMemoryClinicStoreRepository();
  const setupLogRepo = new InMemoryStoreSetupLogRepository();
  const upsertClinicStore = new UpsertClinicStoreUseCase(clinicStoreRepo);
  const seedCalls: Array<{
    storeId: string;
    owner: StorePlatformEventOwnerData | null | undefined;
  }> = [];
  const ensureOwnerCalls: Array<{
    storeId: string;
    owner: StorePlatformEventOwnerData | null | undefined;
  }> = [];
  const ensurePlanMatchesPackCalls: string[] = [];
  const clinicStoreSeeder = {
    seed: async (
      storeId: string,
      owner?: StorePlatformEventOwnerData | null,
    ) => {
      seedCalls.push({ storeId, owner });
    },
    ensureOwner: async (
      storeId: string,
      owner?: StorePlatformEventOwnerData | null,
    ) => {
      ensureOwnerCalls.push({ storeId, owner });
    },
    ensurePlanMatchesPack: async (storeId: string) => {
      ensurePlanMatchesPackCalls.push(storeId);
    },
  } as Pick<
    ClinicStoreSeeder,
    'seed' | 'ensureOwner' | 'ensurePlanMatchesPack'
  > as ClinicStoreSeeder;

  const useCase = new SetupInitialStoreUseCase(
    upsertClinicStore,
    setupLogRepo,
    clinicStoreSeeder,
  );

  return {
    useCase,
    clinicStoreRepo,
    setupLogRepo,
    seedCalls,
    ensureOwnerCalls,
    ensurePlanMatchesPackCalls,
  };
}

describe('SetupInitialStoreUseCase', () => {
  it('mirrors store and seeds when vertical is Clínica', async () => {
    const { useCase, clinicStoreRepo, setupLogRepo, seedCalls } =
      buildUseCase();

    const result = await useCase.execute({ event: baseEvent, runSeed: true });

    expect(result.seeded).toBe(true);
    expect(result.seedVersion).toBe(CLINIC_SEED_TEMPLATE.version);
    expect(seedCalls).toEqual([{ storeId: STORE_ID, owner: null }]);

    const clinicStore = await clinicStoreRepo.findById(STORE_ID);
    expect(clinicStore?.tradeName).toBe('Clínica Demo');

    const log = await setupLogRepo.findByStoreId(STORE_ID);
    expect(log?.version).toBe(CLINIC_SEED_TEMPLATE.version);
  });

  it('repassa o responsável do evento para o seed criar a pessoa de verdade', async () => {
    const { useCase, seedCalls } = buildUseCase();
    const owner = {
      personType: 'PJ',
      responsibleName: 'Maria Silva',
      billingEmail: 'maria.silva@clinica.com.br',
    };

    await useCase.execute({ event: { ...baseEvent, owner }, runSeed: true });

    expect(seedCalls).toEqual([{ storeId: STORE_ID, owner }]);
  });

  it('does not seed when vertical is not Clínica', async () => {
    const { useCase, seedCalls } = buildUseCase();

    const result = await useCase.execute({
      event: { ...baseEvent, vertical: 'Comércio' },
      runSeed: true,
    });

    expect(result.seeded).toBe(false);
    expect(seedCalls).toEqual([]);
  });

  it('is idempotent when setup log version is current', async () => {
    const {
      useCase,
      seedCalls,
      ensureOwnerCalls,
      ensurePlanMatchesPackCalls,
    } = buildUseCase();

    await useCase.execute({ event: baseEvent, runSeed: true });
    const second = await useCase.execute({ event: baseEvent, runSeed: true });

    expect(second.seeded).toBe(false);
    expect(seedCalls).toHaveLength(1);
    // Retry / reentrega ainda tenta o responsável + plano (idempotentes); sem equipe demo.
    expect(ensureOwnerCalls).toEqual([{ storeId: STORE_ID, owner: null }]);
    expect(ensurePlanMatchesPackCalls).toEqual([STORE_ID]);
  });

  it('no retry com seed já aplicado ainda tenta provisionar o owner do evento', async () => {
    const {
      useCase,
      ensureOwnerCalls,
      ensurePlanMatchesPackCalls,
    } = buildUseCase();
    const owner = {
      personType: 'PF',
      responsibleName: 'Danillo Mota',
      billingEmail: 'danillomota99@gmail.com',
    };

    await useCase.execute({ event: baseEvent, runSeed: true });
    await useCase.execute({
      event: { ...baseEvent, owner },
      runSeed: true,
    });

    expect(ensureOwnerCalls).toEqual([{ storeId: STORE_ID, owner }]);
    expect(ensurePlanMatchesPackCalls).toEqual([STORE_ID]);
  });
});
