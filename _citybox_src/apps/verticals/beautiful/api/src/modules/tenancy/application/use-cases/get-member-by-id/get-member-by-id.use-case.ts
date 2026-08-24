import { Injectable } from '@nestjs/common';
import {
  buildWeekScheduleFromRows,
  type WeekSchedule,
} from '../../../../../shared/domain/work-schedule/work-schedule.types';
import { MemberNotInStoreError } from '../../../domain/errors/member.errors';
import {
  MemberRepository,
  type MemberRecord,
} from '../../../domain/repositories/member.repository';

export type GetMemberByIdInput = {
  storeId: string;
  memberId: string;
};

export type GetMemberByIdResult = MemberRecord & {
  week: WeekSchedule;
};

@Injectable()
export class GetMemberByIdUseCase {
  constructor(private readonly members: MemberRepository) {}

  async execute(input: GetMemberByIdInput): Promise<GetMemberByIdResult> {
    const member = await this.members.findInStore(
      input.storeId,
      input.memberId,
    );
    if (!member) {
      throw new MemberNotInStoreError(
        GetMemberByIdUseCase.name,
        input.storeId,
        input.memberId,
      );
    }

    const intervals = await this.members.findWorkIntervals(input.memberId);
    return {
      ...member,
      week: buildWeekScheduleFromRows(intervals),
    };
  }
}
