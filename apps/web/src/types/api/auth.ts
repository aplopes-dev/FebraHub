export type MembershipRole =
  | "sdr"
  | "sales_rep"
  | "customer_success"
  | "manager"
  | "admin"
  | "marketing"
  | "finance";

export type MembershipStatus = "active" | "inactive";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  mustChangePassword: boolean;
};

export type SessionOrganization = {
  id: string;
  tradeName: string;
  logoUrl: string | null;
};

export type SessionMembership = {
  id: string;
  role: MembershipRole;
  permissions: string[];
  isOrganizationOwner: boolean;
};

/** Retornado pelos Route Handlers locais — nunca inclui accessToken/refreshToken. */
export type SessionResponse = {
  user: SessionUser;
  organization: SessionOrganization;
  membership: SessionMembership;
};

export type OrganizationOption = {
  id: string;
  tradeName: string;
  logoUrl: string | null;
  role: MembershipRole;
};

export type LoginResponse =
  | ({ status: "authenticated" } & SessionResponse)
  | { status: "organization_selection_required"; organizations: OrganizationOption[] };

export type MeResponse = {
  user: SessionUser;
  organization: SessionOrganization;
  membership: SessionMembership & { status: MembershipStatus };
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SelectOrganizationInput = {
  organizationId: string;
};

export type RegisterInput = {
  tradeName: string;
  organizationEmail: string;
  name: string;
  email: string;
  username?: string;
  password: string;
  responsiblePersonName: string;
  legalName?: string;
  taxId?: string;
  website?: string;
  phone?: string;
  whatsapp?: string;
};
