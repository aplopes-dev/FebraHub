import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { createEmptyWeekSchedule } from '../../../../../shared/domain/work-schedule/work-schedule.types';
import { InMemoryStoreSettingsRepository } from '../../../tests/in-memory-store-settings.repository';
import { GetStoreWorkScheduleUseCase } from '../get-store-work-schedule/get-store-work-schedule.use-case';
import { ReplaceStoreWorkScheduleUseCase } from './replace-store-work-schedule.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';
const OTHER_STORE_ID = '019c0000-0000-7000-8000-000000000002';

describe('Store work schedule use cases', () => {
  let repository: InMemoryStoreSettingsRepository;
  let replaceUseCase: ReplaceStoreWorkScheduleUseCase;
  let getUseCase: GetStoreWorkScheduleUseCase;

  beforeEach(() => {
    repository = new InMemoryStoreSettingsRepository();
    replaceUseCase = new ReplaceStoreWorkScheduleUseCase(repository);
    getUseCase = new GetStoreWorkScheduleUseCase(repository);
  });

  it('começa com a semana toda fechada', async () => {
    const result = await getUseCase.execute({ storeId: STORE_ID });
    expect(result.week).toEqual(createEmptyWeekSchedule());
  });

  it('persiste os intervalos e devolve a mesma grade na leitura', async () => {
    const week = createEmptyWeekSchedule();
    week.mon = [
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '18:00' },
    ];
    week.sat = [{ startTime: '09:00', endTime: '13:00' }];

    await replaceUseCase.execute({ storeId: STORE_ID, week });

    const stored = await getUseCase.execute({ storeId: STORE_ID });
    expect(stored.week.mon).toEqual(week.mon);
    expect(stored.week.sat).toEqual(week.sat);
    expect(stored.week.sun).toEqual([]);
  });

  it('substitui a grade inteira a cada chamada', async () => {
    const first = createEmptyWeekSchedule();
    first.mon = [{ startTime: '08:00', endTime: '12:00' }];
    await replaceUseCase.execute({ storeId: STORE_ID, week: first });

    const second = createEmptyWeekSchedule();
    second.tue = [{ startTime: '10:00', endTime: '16:00' }];
    await replaceUseCase.execute({ storeId: STORE_ID, week: second });

    const stored = await getUseCase.execute({ storeId: STORE_ID });
    expect(stored.week.mon).toEqual([]);
    expect(stored.week.tue).toEqual(second.tue);
  });

  it('isola grades por storeId', async () => {
    const weekA = createEmptyWeekSchedule();
    weekA.mon = [{ startTime: '08:00', endTime: '12:00' }];
    await replaceUseCase.execute({ storeId: STORE_ID, week: weekA });

    const weekB = createEmptyWeekSchedule();
    weekB.fri = [{ startTime: '10:00', endTime: '14:00' }];
    await replaceUseCase.execute({ storeId: OTHER_STORE_ID, week: weekB });

    const storedA = await getUseCase.execute({ storeId: STORE_ID });
    const storedB = await getUseCase.execute({ storeId: OTHER_STORE_ID });
    expect(storedA.week.mon).toEqual(weekA.mon);
    expect(storedA.week.fri).toEqual([]);
    expect(storedB.week.fri).toEqual(weekB.fri);
    expect(storedB.week.mon).toEqual([]);
  });

  it('rejeita intervalos sobrepostos', async () => {
    const week = createEmptyWeekSchedule();
    week.mon = [
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '11:00', endTime: '18:00' },
    ];

    await expect(
      replaceUseCase.execute({ storeId: STORE_ID, week }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejeita intervalo com início depois do fim', async () => {
    const week = createEmptyWeekSchedule();
    week.fri = [{ startTime: '18:00', endTime: '09:00' }];

    await expect(
      replaceUseCase.execute({ storeId: STORE_ID, week }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
