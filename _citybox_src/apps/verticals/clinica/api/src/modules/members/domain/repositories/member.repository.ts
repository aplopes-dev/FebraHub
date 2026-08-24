import type { OrganizationMemberRole } from '../organization-member-role';
import type {
  ProfessionalCouncilSnapshot,
  ProfessionalCouncilType,
} from '../professional-council';

export type ClinicMembership = {
  clinicId: string;
  clinicName: string;
  role: string;
  permissions: string[];
};

export type MemberRecord = {
  id: string;
  organizationId: string;
  keycloakSub: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  status: 'active' | 'disabled';
  /**
   * Responsável pela organização vs. colaborador — eixo ortogonal ao papel clínico de
   * `memberships[].role`. Ver `organization-member-role.ts`.
   */
  organizationRole: OrganizationMemberRole;
  /**
   * Estado da credencial no Keycloak. `false` = convite pendente (senha provisória
   * gerada, primeiro acesso não feito). A tela de equipe deriva
   * `pending`/`expired`/`inactive` a partir destes três campos.
   */
  hasPassword: boolean;
  provisionalExpiresAt: Date | null;
  disabledAt: Date | null;
  /** Inscrição no conselho (CRM/CRO) — null até a 1ª emissão de documento. */
  councilType: ProfessionalCouncilType | null;
  councilNumber: string | null;
  councilUf: string | null;
  memberships: ClinicMembership[];
};

export type CreateMemberData = {
  id?: string;
  organizationId: string;
  keycloakSub: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  hasPassword: boolean;
  /** Omitido = `COLLABORATOR`. Só o provisionamento do responsável passa `OWNER`. */
  organizationRole?: OrganizationMemberRole;
  clinics: Array<{ clinicId: string; role: string; permissions: string[] }>;
};

/**
 * Linha de `members` incluindo soft-delete — usada só no create para decidir entre
 * 409 claro e reativação (o `@unique` de `keycloak_sub`/`username` inclui removidos).
 */
export type MemberPersistenceRecord = MemberRecord & {
  deletedAt: Date | null;
};

export type RestoreMemberData = {
  keycloakSub: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  clinics: Array<{ clinicId: string; role: string; permissions: string[] }>;
};

export abstract class MemberRepository {
  abstract findById(id: string): Promise<MemberRecord | null>;
  abstract findByUsername(username: string): Promise<MemberRecord | null>;
  /**
   * Busca por e-mail para barrar duplicidade na edição de membro.
   *
   * `Member.email` **não** é `@unique` no banco (ao contrário de `username`), porque
   * membro pode nascer sem e-mail. Sem esta checagem, dois membros ficariam com o mesmo
   * e-mail no ERP e o Keycloak recusaria só no `updateProfile` — que é chamado com
   * `.catch(() => undefined)`, ou seja, a falha sumiria e o operador veria "salvo".
   */
  abstract findByEmail(email: string): Promise<MemberRecord | null>;
  /**
   * Responsável vivo da organização, se houver. Base da idempotência do provisionamento
   * e da checagem da invariante de OWNER único antes de gravar.
   */
  abstract findOwnerByOrganization(
    organizationId: string,
  ): Promise<MemberRecord | null>;
  /** Descoberta de acesso no login — base do `GET /v1/members/me`. */
  abstract findByKeycloakSub(sub: string): Promise<MemberRecord | null>;
  /**
   * Inclui soft-deleted — `keycloak_sub` é `@unique` global; sem isto o create
   * estoura P2002 quando o Keycloak reaproveita o sub de alguém removido.
   */
  abstract findAnyByKeycloakSub(
    sub: string,
  ): Promise<MemberPersistenceRecord | null>;
  /** Inclui soft-deleted — `username` também é `@unique` global. */
  abstract findAnyByUsername(
    username: string,
  ): Promise<MemberPersistenceRecord | null>;
  abstract listByOrganization(organizationId: string): Promise<MemberRecord[]>;
  abstract countActiveByOrganization(organizationId: string): Promise<number>;
  abstract create(data: CreateMemberData): Promise<MemberRecord>;
  /**
   * Reabre membro soft-deleted: limpa `deletedAt`, reativa status e reescreve
   * perfil + clínicas (semântica da tela de "adicionar de novo").
   */
  abstract restore(
    id: string,
    data: RestoreMemberData,
  ): Promise<MemberRecord>;
  abstract setStatus(id: string, status: 'active' | 'disabled'): Promise<void>;
  abstract update(id: string, data: UpdateMemberData): Promise<MemberRecord>;
  /**
   * Grava conselho só se o membro ainda não tiver os 3 campos. Idempotente na 2ª emissão.
   */
  abstract setProfessionalCouncilIfEmpty(
    id: string,
    council: ProfessionalCouncilSnapshot,
  ): Promise<MemberRecord>;
  abstract softDelete(id: string): Promise<void>;
  /**
   * Registra que o membro está com senha provisória: volta a `hasPassword: false` e
   * grava o prazo. A senha do Keycloak é `temporary: true`, então o membro ainda não
   * definiu a dele — marcar como "com senha" mostraria "ativo" numa conta que ninguém
   * acessou ainda.
   */
  abstract markProvisionalPassword(id: string, expiresAt: Date): Promise<void>;
  /**
   * Primeiro acesso concluído: o membro autenticou com JWT válido (Keycloak já exigiu
   * `UPDATE_PASSWORD` antes de emitir o token). Limpa o prazo provisório.
   */
  abstract markPasswordSet(id: string): Promise<void>;
}

export type UpdateMemberData = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  clinics?: Array<{ clinicId: string; role: string; permissions: string[] }>;
};
