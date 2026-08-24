import type { WeekSchedule } from '../../../../../shared/domain/work-schedule/work-schedule.types';
import type { MemberRecord } from '../../../domain/repositories/member.repository';
import { memberDisplayName } from '../../../domain/repositories/member.repository';
import { effectiveStorePermissions } from '../../../domain/resolve-store-permissions';
import { STORE_PERMISSION_IDS } from '@citybox/beautiful-permissions';
import type { MyAccessResult } from '../../../application/use-cases/get-my-access/get-my-access.use-case';
import type { CreateMemberResult } from '../../../application/use-cases/create-member/create-member.use-case';
import type { ResetMemberPasswordResult } from '../../../application/use-cases/reset-member-password/reset-member-password.use-case';
import type { MemberWorkSchedule } from '../../../application/use-cases/get-member-work-schedule/get-member-work-schedule.use-case';
import { storeRoleLabel } from '../../../domain/store-role.catalog';
import { organizationRoleLabel } from '../../../domain/organization-member-role';

export const MembersPresenter = {
  one(member: MemberRecord, extras?: { week?: WeekSchedule }) {
    return {
      id: member.id,
      username: member.username,
      firstName: member.firstName,
      lastName: member.lastName,
      name: memberDisplayName(member),
      email: member.email,
      phone: member.phone,
      status: member.status,
      organizationRole: member.organizationRole,
      organizationRoleLabel: organizationRoleLabel(member.organizationRole),
      isOrganizationOwner: member.organizationRole === 'OWNER',
      hasPassword: member.hasPassword,
      provisionalExpiresAt: member.provisionalExpiresAt?.toISOString() ?? null,
      disabledAt: member.disabledAt?.toISOString() ?? null,
      serviceIds: member.serviceIds ?? [],
      services: member.services ?? [],
      stores: member.memberships.map((m) => ({
        storeId: m.storeId,
        storeName: m.storeName,
        role: m.role,
        roleLabel: storeRoleLabel(m.role),
        permissions:
          member.organizationRole === 'OWNER'
            ? [...STORE_PERMISSION_IDS]
            : effectiveStorePermissions(m.role, m.permissions),
      })),
      ...(extras?.week !== undefined ? { week: extras.week } : {}),
    };
  },

  list(members: MemberRecord[]) {
    return members.map((m) => MembersPresenter.one(m));
  },

  created(result: CreateMemberResult) {
    return {
      ...MembersPresenter.one(result.member),
      provisionalPassword: result.provisionalPassword,
    };
  },

  resetPassword(result: ResetMemberPasswordResult) {
    return {
      username: result.username,
      provisionalPassword: result.provisionalPassword,
    };
  },

  workSchedule(schedule: MemberWorkSchedule) {
    return {
      memberId: schedule.memberId,
      week: schedule.week,
    };
  },

  workSchedules(schedules: MemberWorkSchedule[]) {
    return schedules.map((s) => MembersPresenter.workSchedule(s));
  },

  myAccess(result: MyAccessResult) {
    return result;
  },
};
