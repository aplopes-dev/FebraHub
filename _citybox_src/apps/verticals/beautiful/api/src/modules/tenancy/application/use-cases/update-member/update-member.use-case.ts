import { Injectable } from '@nestjs/common';
import { validateWeekSchedule } from '../../../../../shared/domain/work-schedule/work-schedule.validator';
import {
  flattenWeekSchedule,
  type WeekSchedule,
} from '../../../../../shared/domain/work-schedule/work-schedule.types';
import { isStoreRole } from '../../../domain/store-role.catalog';
import { resolveStorePermissions } from '../../../domain/resolve-store-permissions';
import {
  InvalidStoreRoleError,
  LinkedServiceNotFoundError,
  MemberNotInStoreError,
  OrganizationOwnerProtectedError,
} from '../../../domain/errors/member.errors';
import {
  MemberRepository,
  type MemberRecord,
} from '../../../domain/repositories/member.repository';

export type UpdateMemberInput = {
  storeId: string;
  memberId: string;
  phone?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  status?: 'active' | 'disabled';
  role?: string;
  permissions?: string[];
  serviceIds?: string[];
  week?: WeekSchedule;
};

@Injectable()
export class UpdateMemberUseCase {
  constructor(private readonly members: MemberRepository) {}

  async execute(input: UpdateMemberInput): Promise<MemberRecord> {
    const existing = await this.members.findInStore(
      input.storeId,
      input.memberId,
    );
    if (!existing) {
      throw new MemberNotInStoreError(
        UpdateMemberUseCase.name,
        input.storeId,
        input.memberId,
      );
    }

    if (input.serviceIds !== undefined) {
      await this.assertServicesExist(input.storeId, input.serviceIds);
    }

    if (input.week !== undefined) {
      validateWeekSchedule(input.week);
    }

    const membership = existing.memberships.find(
      (m) => m.storeId === input.storeId,
    );
    const nextRole =
      input.role !== undefined
        ? input.role.trim().toLowerCase()
        : membership?.role;

    if (input.role !== undefined) {
      if (!nextRole || !isStoreRole(nextRole)) {
        throw new InvalidStoreRoleError(UpdateMemberUseCase.name, input.role);
      }
    }

    if (existing.organizationRole === 'OWNER') {
      if (input.status === 'disabled') {
        throw new OrganizationOwnerProtectedError(
          UpdateMemberUseCase.name,
          existing.id,
          'update(status=disabled)',
        );
      }
      if (input.permissions !== undefined) {
        throw new OrganizationOwnerProtectedError(
          UpdateMemberUseCase.name,
          existing.id,
          'update(permissions)',
        );
      }
    }

    const hasProfilePatch =
      input.phone !== undefined ||
      input.firstName !== undefined ||
      input.lastName !== undefined ||
      input.email !== undefined ||
      input.status !== undefined;

    if (hasProfilePatch) {
      await this.members.updateProfile(input.memberId, {
        phone: input.phone,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        status: input.status,
      });
    }

    if (input.role !== undefined || input.permissions !== undefined) {
      const role = nextRole ?? membership?.role ?? 'profissional';
      const permissions =
        existing.organizationRole === 'OWNER'
          ? undefined
          : input.permissions !== undefined
            ? resolveStorePermissions(role, input.permissions)
            : input.role !== undefined
              ? resolveStorePermissions(role, undefined)
              : undefined;

      await this.members.replaceStoreMembership(input.storeId, input.memberId, {
        ...(input.role !== undefined ? { role } : {}),
        ...(permissions !== undefined ? { permissions } : {}),
      });
    }

    if (input.serviceIds !== undefined) {
      await this.members.replaceServiceIds(input.memberId, input.serviceIds);
    }

    if (input.week !== undefined) {
      await this.members.replaceWorkIntervals(
        input.memberId,
        flattenWeekSchedule(input.week),
      );
    }

    const refreshed = await this.members.findInStore(
      input.storeId,
      input.memberId,
    );
    return refreshed ?? existing;
  }

  private async assertServicesExist(
    storeId: string,
    ids: string[],
  ): Promise<void> {
    if (ids.length === 0) return;
    const found = await this.members.findExistingServiceIds(storeId, ids);
    const foundIds = new Set(found);
    const missing = ids.find((id) => !foundIds.has(id));
    if (missing) {
      throw new LinkedServiceNotFoundError(UpdateMemberUseCase.name, missing);
    }
  }
}
