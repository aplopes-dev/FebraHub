import type { WeekSchedule } from '../../../../../shared/domain/work-schedule/work-schedule.types';
import type { StoreWorkSchedule } from '../../../domain/store-work-schedule.types';

export interface StoreWorkScheduleResponse {
  week: WeekSchedule;
}

export class StoreWorkSchedulePresenter {
  static toHTTP(schedule: StoreWorkSchedule): StoreWorkScheduleResponse {
    return { week: schedule.week };
  }
}
