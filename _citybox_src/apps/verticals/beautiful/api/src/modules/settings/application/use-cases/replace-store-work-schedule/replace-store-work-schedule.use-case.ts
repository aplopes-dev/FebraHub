import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  flattenWeekSchedule,
  type WeekSchedule,
} from '../../../../../shared/domain/work-schedule/work-schedule.types';
import { validateWeekSchedule } from '../../../../../shared/domain/work-schedule/work-schedule.validator';
import type { StoreWorkSchedule } from '../../../domain/store-work-schedule.types';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export interface ReplaceStoreWorkScheduleInput {
  storeId: string;
  week: WeekSchedule;
}

@Injectable()
export class ReplaceStoreWorkScheduleUseCase implements IUseCase<
  ReplaceStoreWorkScheduleInput,
  StoreWorkSchedule
> {
  constructor(private readonly repository: StoreSettingsRepository) {}

  async execute(
    input: ReplaceStoreWorkScheduleInput,
  ): Promise<StoreWorkSchedule> {
    validateWeekSchedule(input.week);

    const settings = await this.repository.getOrCreateDefault(input.storeId);
    await this.repository.replaceWorkIntervals(
      settings.id,
      flattenWeekSchedule(input.week),
    );

    return { week: input.week };
  }
}
