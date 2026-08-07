import type { MembershipRole, MembershipStatus, SessionUser } from "@/types/api/auth";

export type Membership = {
  id: string;
  role: MembershipRole;
  status: MembershipStatus;
  permissions: string[];
  /** Taxa default de comissão do membro (%). Null = usa fallback da organização. */
  defaultCommissionRate: number | null;
  createdAt: string;
  updatedAt: string;
  user: SessionUser;
};

export type InviteMemberInput = {
  name: string;
  email: string;
  username?: string;
  role: MembershipRole;
  permissions?: string[];
  defaultCommissionRate?: number | null;
};

export type UpdateMemberCommissionRateInput = {
  defaultCommissionRate: number | null;
};

export type InviteMemberResponse = Membership & { provisionalPassword?: string };

export type UpdateMemberRoleInput = { role: MembershipRole };
export type UpdateMemberPermissionsInput = { permissions: string[] };
export type UpdateMemberStatusInput = { status: MembershipStatus };

/** Resposta dos PATCH de role/permissions/status — sem `user`/`createdAt`. */
export type MembershipUpdateResponse = Omit<Membership, "user" | "createdAt">;

export type ResetMemberPasswordResponse = { provisionalPassword: string };

export const MEMBERSHIP_ROLE_LABELS: Record<MembershipRole, string> = {
  sdr: "SDR",
  sales_rep: "Vendedor",
  customer_success: "Pós-venda",
  manager: "Gestor",
  admin: "Admin",
  marketing: "Marketing",
  finance: "Financeiro",
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};
