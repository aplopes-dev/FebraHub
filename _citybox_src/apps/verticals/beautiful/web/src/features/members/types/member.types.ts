import type { WeekSchedule } from '@/lib/work-schedule';
import { SCHEDULABLE_STORE_ROLES } from '@citybox/beautiful-permissions';

export type StoreRoleOption = {
  id: string;
  label: string;
};

/** Papéis que aparecem na agenda (colunas = role profissional). */
export const SCHEDULABLE_ROLES = SCHEDULABLE_STORE_ROLES;

export type SchedulableRole = (typeof SCHEDULABLE_ROLES)[number];

export function isSchedulableRole(role: string): boolean {
  return (SCHEDULABLE_ROLES as readonly string[]).includes(role);
}

export type MemberServiceSummary = {
  id: string;
  name: string;
};

export type MemberStoreLink = {
  storeId: string;
  storeName: string;
  role: string;
  roleLabel: string;
  permissions: string[];
};

export type StoreMember = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'active' | 'disabled';
  organizationRole: 'OWNER' | 'COLLABORATOR';
  isOrganizationOwner: boolean;
  serviceIds: string[];
  services: MemberServiceSummary[];
  stores: MemberStoreLink[];
};

/** Detalhe GET /members/:id — inclui grade semanal. */
export type StoreMemberDetail = StoreMember & {
  week: WeekSchedule;
};

export type CreateMemberFormData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  permissions: string[];
  /** Só para papéis agendáveis — aplicados após o POST via PATCH. */
  serviceIds?: string[];
  week?: WeekSchedule;
};

export type CreatedMember = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  provisionalPassword: string;
  stores: MemberStoreLink[];
};

export type UpdateMemberFormData = {
  phone?: string | null;
  role?: string;
  permissions?: string[];
  serviceIds?: string[];
  week?: WeekSchedule;
  status?: 'active' | 'disabled';
  firstName?: string;
  lastName?: string;
  email?: string | null;
};

export type MemberWorkSchedule = {
  memberId: string;
  week: WeekSchedule;
};

export type ResetMemberPasswordResult = {
  username: string;
  provisionalPassword: string;
};

export type MemberProvisionalCredentials = {
  username: string;
  provisionalPassword: string;
  title?: string;
  subtitle?: string;
};
