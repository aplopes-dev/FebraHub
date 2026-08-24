import type {
  TeamMemberEntity,
  TeamMemberPermissions,
  TeamMemberRole,
} from '../entities/team-member.entity';

export type TeamMemberWritePayload = {
  name: string;
  email: string;
  phone: string;
  role: TeamMemberRole;
  initials: string;
  active: boolean;
  permissions: TeamMemberPermissions;
};

export type TeamMemberCreatePayload = TeamMemberWritePayload & {
  agentId: string;
  temporaryPassword: string | null;
  passwordHash: string | null;
  mustChangePassword: boolean;
  lastAccessAt: Date | null;
  keycloakSub?: string | null;
  username?: string | null;
  hasPassword?: boolean;
};

export type TeamMemberKeycloakPayload = {
  keycloakSub: string;
  username: string;
  hasPassword?: boolean;
};

export type TeamMemberCredentialsPayload = {
  passwordHash: string | null;
  temporaryPassword: string | null;
  mustChangePassword: boolean;
};

export abstract class TeamMemberRepository {
  abstract findAll(storeId: string): Promise<TeamMemberEntity[]>;

  abstract findByAgentId(
    storeId: string,
    agentId: string,
  ): Promise<TeamMemberEntity | null>;

  /**
   * Catálogo público `/agents/:slug` — resolve o corretor em qualquer loja.
   * `agentId` é único só por loja; pode haver colisão entre organizations.
   */
  abstract findActiveByAgentIdGlobal(
    agentId: string,
  ): Promise<TeamMemberEntity[]>;

  abstract findByEmail(
    storeId: string,
    email: string,
  ): Promise<TeamMemberEntity | null>;

  /** Responsável da loja = `role=admin` ativo (OWNER no contrato M2M do admin). */
  abstract findActiveAdmin(storeId: string): Promise<TeamMemberEntity | null>;

  abstract findByKeycloakSub(keycloakSub: string): Promise<TeamMemberEntity[]>;

  abstract findByStoreAndKeycloakSub(
    storeId: string,
    keycloakSub: string,
  ): Promise<TeamMemberEntity | null>;

  abstract findByEmailInsensitive(email: string): Promise<TeamMemberEntity[]>;

  abstract linkKeycloakSub(
    memberId: string,
    payload: TeamMemberKeycloakPayload,
  ): Promise<TeamMemberEntity | null>;

  abstract markPasswordSet(memberId: string): Promise<void>;

  abstract create(
    storeId: string,
    payload: TeamMemberCreatePayload,
  ): Promise<TeamMemberEntity>;

  /** `null` quando o usuário não existe na loja. */
  abstract update(
    storeId: string,
    agentId: string,
    payload: TeamMemberWritePayload,
  ): Promise<TeamMemberEntity | null>;

  abstract updateCredentials(
    storeId: string,
    agentId: string,
    payload: TeamMemberCredentialsPayload,
  ): Promise<TeamMemberEntity | null>;

  abstract setActive(
    storeId: string,
    agentId: string,
    active: boolean,
  ): Promise<TeamMemberEntity | null>;

  abstract delete(storeId: string, agentId: string): Promise<boolean>;
}
