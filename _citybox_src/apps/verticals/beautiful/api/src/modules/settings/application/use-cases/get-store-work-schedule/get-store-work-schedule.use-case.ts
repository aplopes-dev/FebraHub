import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { buildWeekScheduleFromRows } from '../../../../../shared/domain/work-schedule/work-schedule.types';
import type { StoreWorkSchedule } from '../../../domain/store-work-schedule.types';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export interface GetStoreWorkScheduleInput {
  storeId: string;
}

@Injectable()
export class GetStoreWorkScheduleUseCase implements IUseCase<
  GetStoreWorkScheduleInput,
  StoreWorkSchedule
> {
  constructor(private readonly repository: StoreSettingsRepository) {}

  async execute(input: GetStoreWorkScheduleInput): Promise<StoreWorkSchedule> {
    const settings = await this.repository.getOrCreateDefault(input.storeId);
    const rows = await this.repository.findWorkIntervals(settings.id);
    return { week: buildWeekScheduleFromRows(rows) };
  }
}
