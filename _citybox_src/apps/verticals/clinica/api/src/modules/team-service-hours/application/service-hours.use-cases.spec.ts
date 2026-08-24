import { GetServiceHoursUseCase } from '../application/get-service-hours.use-case';
import { UpsertServiceHoursUseCase } from '../application/upsert-service-hours.use-case';
import { createDefaultServiceHours } from '../domain/service-hours.types';
import { InMemoryProfessionalServiceHoursRepository } from '../tests/in-memory-professional-service-hours.repository';

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';

describe('Service hours use cases', () => {
  let repo: InMemoryProfessionalServiceHoursRepository;
  let getUseCase: GetServiceHoursUseCase;
  let upsertUseCase: UpsertServiceHoursUseCase;

  beforeEach(() => {
    repo = new InMemoryProfessionalServiceHoursRepository();
    getUseCase = new GetServiceHoursUseCase(repo);
    upsertUseCase = new UpsertServiceHoursUseCase(repo);
  });

  it('returns defaults when member has no saved hours', async () => {
    const result = await getUseCase.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
    });
    expect(result).toEqual(createDefaultServiceHours());
  });

  it('creates service hours on upsert', async () => {
    const config = createDefaultServiceHours();
    config.defaultConsultationMinutes = 45;

    const saved = await upsertUseCase.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      config,
    });

    expect(saved.defaultConsultationMinutes).toBe(45);
    expect(repo.getAll().size).toBe(1);
  });

  it('updates service hours on subsequent upsert', async () => {
    const initial = createDefaultServiceHours();
    await upsertUseCase.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      config: initial,
    });

    const updated = createDefaultServiceHours();
    updated.weekSchedule.sat = {
      enabled: true,
      startTime: '09:00',
      endTime: '12:00',
    };

    await upsertUseCase.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      config: updated,
    });

    const loaded = await getUseCase.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
    });
    expect(loaded.weekSchedule.sat).toEqual({
      enabled: true,
      startTime: '09:00',
      endTime: '12:00',
    });
  });
});
