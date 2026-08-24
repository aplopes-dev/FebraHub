import { Injectable } from '@nestjs/common';
import {
  buildWeekScheduleFromRows,
  type WorkIntervalRow,
} from '../../../../../shared/domain/work-schedule/work-schedule.types';
import {
  MemberRepository,
  type MemberRecord,
} from '../../../domain/repositories/member.repository';
import type { MemberWorkSchedule } from '../get-member-work-schedule/get-member-work-schedule.use-case';

export type ListMemberWorkSchedulesInput = {
  storeId: string;
  /** Filtra pelos membros informados. Se omitido, usa schedulable da loja. */
  memberIds?: string[];
  /** Default true — só owner|profissional. */
  schedulable?: boolean;
};

@Injectable()
export class ListMemberWorkSchedulesUseCase {
  constructor(private readonly members: MemberRepository) {}

  async execute(
    input: ListMemberWorkSchedulesInput,
  ): Promise<MemberWorkSchedule[]> {
    const wantSchedulable = input.schedulable !== false;

    let ordered: MemberRecord[];

    if (input.memberIds && input.memberIds.length > 0) {
      if (wantSchedulable) {
        const found = await this.members.findSchedulableByIds(
          input.storeId,
          input.memberIds,
        );
        const byId = new Map(found.map((m) => [m.id, m]));
        ordered = input.memberIds
          .map((id) => byId.get(id))
          .filter((m): m is MemberRecord => Boolean(m));
      } else {
        const found = await Promise.all(
          input.memberIds.map((id) =>
            this.members.findInStore(input.storeId, id),
          ),
        );
        ordered = found.filter((m): m is MemberRecord => Boolean(m));
      }
    } else {
      ordered = await this.members.listByStoreId(input.storeId, {
        schedulable: wantSchedulable ? true : undefined,
        status: 'active',
      });
    }

    const memberIds = ordered.map((m) => m.id);
    if (memberIds.length === 0) {
      return [];
    }

    const rows = await this.members.findWorkIntervalsForMembers({ memberIds });
    const rowsByMember = new Map<string, WorkIntervalRow[]>();
    for (const id of memberIds) {
      rowsByMember.set(id, []);
    }
    for (const row of rows) {
      const list = rowsByMember.get(row.memberId);
      if (list) {
        list.push({
          weekday: row.weekday,
          startTime: row.startTime,
          endTime: row.endTime,
          sortOrder: row.sortOrder,
        });
      }
    }

    return memberIds.map((memberId) => ({
      memberId,
      week: buildWeekScheduleFromRows(rowsByMember.get(memberId) ?? []),
    }));
  }
}
