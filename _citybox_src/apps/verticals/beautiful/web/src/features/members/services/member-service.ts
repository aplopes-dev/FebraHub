import { beautifulFetch } from '@/lib/beautiful-api';
import {
  createEmptyWeekSchedule,
  type WeekSchedule,
} from '@/lib/work-schedule';
import type {
  CreateMemberFormData,
  CreatedMember,
  MemberServiceSummary,
  MemberStoreLink,
  MemberWorkSchedule,
  ResetMemberPasswordResult,
  StoreMember,
  StoreMemberDetail,
  StoreRoleOption,
  UpdateMemberFormData,
} from '../types/member.types';
import { isSchedulableRole } from '../types/member.types';

type RolesResponse = { items: StoreRoleOption[] };

type MemberApiResponse = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string | null;
  phone: string | null;
  status: 'active' | 'disabled';
  organizationRole?: 'OWNER' | 'COLLABORATOR';
  isOrganizationOwner?: boolean;
  serviceIds?: string[];
  services?: MemberServiceSummary[];
  stores?: Array<{
    storeId: string;
    storeName: string;
    role: string;
    roleLabel: string;
    permissions?: string[];
  }>;
  week?: WeekSchedule;
  provisionalPassword?: string;
};

export type ListMembersParams = {
  search?: string;
  status?: 'active' | 'disabled';
  schedulable?: boolean;
  /** Papel exato na loja (`profissional` | `recepcao` | `gerente`). */
  role?: string;
};

function memberDisplayName(raw: MemberApiResponse): string {
  if (raw.name?.trim()) return raw.name.trim();
  return `${raw.firstName} ${raw.lastName}`.trim();
}

function mapMember(raw: MemberApiResponse): StoreMember {
  const services = raw.services ?? [];
  const serviceIds = raw.serviceIds ?? services.map((service) => service.id);

  return {
    id: raw.id,
    username: raw.username,
    firstName: raw.firstName,
    lastName: raw.lastName,
    name: memberDisplayName(raw),
    email: raw.email,
    phone: raw.phone,
    status: raw.status,
    organizationRole: raw.organizationRole ?? 'COLLABORATOR',
    isOrganizationOwner: raw.isOrganizationOwner ?? false,
    serviceIds,
    services,
    stores: (raw.stores ?? []).map((store) => ({
      storeId: store.storeId,
      storeName: store.storeName,
      role: store.role,
      roleLabel: store.roleLabel,
      permissions: store.permissions ?? [],
    })),
  };
}

function mapMemberDetail(raw: MemberApiResponse): StoreMemberDetail {
  return {
    ...mapMember(raw),
    week: raw.week ?? createEmptyWeekSchedule(),
  };
}

export async function listMemberRoles(): Promise<StoreRoleOption[]> {
  const data = await beautifulFetch<RolesResponse>('/v1/members/roles');
  return data.items ?? [];
}

export async function listMembers(
  params?: ListMembersParams,
): Promise<StoreMember[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.schedulable !== undefined) {
    query.set('schedulable', String(params.schedulable));
  }
  if (params?.role) query.set('role', params.role);

  const queryString = query.toString();
  const path = `/v1/members${queryString ? `?${queryString}` : ''}`;
  const response = await beautifulFetch<
    MemberApiResponse[] | { items?: MemberApiResponse[] }
  >(path);
  const rows = Array.isArray(response) ? response : (response.items ?? []);
  return rows.map(mapMember);
}

export async function getMemberById(id: string): Promise<StoreMemberDetail> {
  const response = await beautifulFetch<MemberApiResponse>(
    `/v1/members/${id}`,
  );
  return mapMemberDetail(response);
}

export async function createMember(
  data: CreateMemberFormData,
): Promise<CreatedMember> {
  const response = await beautifulFetch<MemberApiResponse & {
    provisionalPassword: string;
  }>('/v1/members', {
    method: 'POST',
    body: JSON.stringify({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      username: data.username.trim().toLowerCase(),
      email: data.email.trim() || null,
      phone: data.phone?.trim() || null,
      role: data.role,
      permissions: data.permissions,
    }),
  });

  const member = mapMember(response);

  if (
    isSchedulableRole(data.role) &&
    (data.serviceIds !== undefined || data.week !== undefined)
  ) {
    await updateMember(member.id, {
      serviceIds: data.serviceIds,
      week: data.week,
    });
  }

  return {
    id: member.id,
    username: member.username,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    provisionalPassword: response.provisionalPassword,
    stores: member.stores,
  };
}

export async function updateMember(
  id: string,
  data: UpdateMemberFormData,
): Promise<StoreMember> {
  const body: Record<string, unknown> = {};
  if (data.phone !== undefined) body.phone = data.phone?.trim() || null;
  if (data.role !== undefined) body.role = data.role;
  if (data.permissions !== undefined) body.permissions = data.permissions;
  if (data.serviceIds !== undefined) body.serviceIds = data.serviceIds;
  if (data.week !== undefined) body.week = data.week;
  if (data.status !== undefined) body.status = data.status;
  if (data.firstName !== undefined) body.firstName = data.firstName.trim();
  if (data.lastName !== undefined) body.lastName = data.lastName.trim();
  if (data.email !== undefined) body.email = data.email?.trim() || null;

  const response = await beautifulFetch<MemberApiResponse>(
    `/v1/members/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
  return mapMember(response);
}

export async function getMemberWorkSchedule(
  memberId: string,
): Promise<MemberWorkSchedule> {
  return beautifulFetch<MemberWorkSchedule>(
    `/v1/members/${memberId}/work-schedule`,
  );
}

export type ListMemberWorkSchedulesParams = {
  memberIds?: string[];
  schedulable?: boolean;
};

export async function listMemberWorkSchedules(
  params?: ListMemberWorkSchedulesParams,
): Promise<MemberWorkSchedule[]> {
  const query = new URLSearchParams();
  if (params?.memberIds && params.memberIds.length > 0) {
    query.set('memberIds', params.memberIds.join(','));
  }
  if (params?.schedulable !== undefined) {
    query.set('schedulable', String(params.schedulable));
  }
  const queryString = query.toString();
  const path = `/v1/members/work-schedules${queryString ? `?${queryString}` : ''}`;
  return beautifulFetch<MemberWorkSchedule[]>(path);
}

export async function replaceMemberWorkSchedule(
  memberId: string,
  week: WeekSchedule,
): Promise<MemberWorkSchedule> {
  return beautifulFetch<MemberWorkSchedule>(
    `/v1/members/${memberId}/work-schedule`,
    {
      method: 'PUT',
      body: JSON.stringify({ week }),
    },
  );
}

export async function resetMemberPassword(
  memberId: string,
): Promise<ResetMemberPasswordResult> {
  return beautifulFetch<ResetMemberPasswordResult>(
    `/v1/members/${memberId}/reset-password`,
    { method: 'POST' },
  );
}
