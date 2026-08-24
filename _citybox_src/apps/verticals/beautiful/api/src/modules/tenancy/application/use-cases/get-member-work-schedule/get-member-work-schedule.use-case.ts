import { Injectable } from '@nestjs/common';
import {
  buildWeekScheduleFromRows,
  type WeekSchedule,
} from '../../../../../shared/domain/work-schedule/work-schedule.types';
import { MemberNotInStoreError } from '../../../domain/errors/member.errors';
import { MemberRepository } from '../../../domain/repositories/member.repository';

export type GetMemberWorkScheduleInput = {
  storeId: string;
  memberId: string;
};

export type MemberWorkSchedule = {
  memberId: string;
  week: WeekSchedule;
};

@Injectable()
export class GetMemberWorkScheduleUseCase {
  constructor(private readonly members: MemberRepository) {}

  async execute(
    input: GetMemberWorkScheduleInput,
  ): Promise<MemberWorkSchedule> {
    const member = await this.members.findInStore(
      input.storeId,
      input.memberId,
    );
    if (!member) {
      throw new MemberNotInStoreError(
        GetMemberWorkScheduleUseCase.name,
        input.storeId,
        input.memberId,
      );
    }

    const rows = await this.members.findWorkIntervals(input.memberId);
    return {
      memberId: input.memberId,
      week: buildWeekScheduleFromRows(rows),
    };
  }
}
