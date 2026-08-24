import { Injectable } from '@nestjs/common';
import { validateWeekSchedule } from '../../../../../shared/domain/work-schedule/work-schedule.validator';
import {
  flattenWeekSchedule,
  type WeekSchedule,
} from '../../../../../shared/domain/work-schedule/work-schedule.types';
import { MemberNotInStoreError } from '../../../domain/errors/member.errors';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import type { MemberWorkSchedule } from '../get-member-work-schedule/get-member-work-schedule.use-case';

export type ReplaceMemberWorkScheduleInput = {
  storeId: string;
  memberId: string;
  week: WeekSchedule;
};

@Injectable()
export class ReplaceMemberWorkScheduleUseCase {
  constructor(private readonly members: MemberRepository) {}

  async execute(
    input: ReplaceMemberWorkScheduleInput,
  ): Promise<MemberWorkSchedule> {
    const member = await this.members.findInStore(
      input.storeId,
      input.memberId,
    );
    if (!member) {
      throw new MemberNotInStoreError(
        ReplaceMemberWorkScheduleUseCase.name,
        input.storeId,
        input.memberId,
      );
    }

    validateWeekSchedule(input.week);
    await this.members.replaceWorkIntervals(
      input.memberId,
      flattenWeekSchedule(input.week),
    );

    return {
      memberId: input.memberId,
      week: input.week,
    };
  }
}
