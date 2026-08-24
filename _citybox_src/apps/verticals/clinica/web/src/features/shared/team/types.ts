/**
 * Tipos compartilhados de gestão de equipe da loja. O contrato espelha o
 * endpoint store-scoped do platform-api (`/v1/backoffice/stores/:storeId/team`)
 * e é independente de vertical — a UI é específica de cada vertical, a camada
 * de dados é comum.
 *
 * Status compartilhado (`active` | `pending`) cobre food/varejo. Soft-disable
 * e expiração provisória (`disabledAt` / `provisionalExpiresAt`) são campos
 * opcionais; a vertical clinic deriva `inactive`/`expired` localmente.
 */

import type { ProfessionalCouncilType } from '@citybox/messaging/professional-council';

/**
 * Status derivado para exibição compartilhada:
 * - `active`: senha definida
 * - `pending`: aguardando primeiro acesso (sem senha)
 */
export type TeamMemberStatus = "active" | "pending";

/** Membro da equipe da loja. `name` e `status` são derivados no mapeamento. */
export type TeamMember = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email?: string;
  role: string;
  roleLabel: string;
  permissions: string[];
  hasPassword: boolean;
  status: TeamMemberStatus;
  /** Soft-desativado na loja (platform-api). Clinic deriva status `inactive`. */
  disabledAt?: string | null;
  /** Prazo do convite/senha provisória. Clinic deriva status `expired`. */
  provisionalExpiresAt?: string | null;
  /** Inscrição no conselho (CRM/CRO/CREFITO/CRN) — null até a 1ª emissão de documento. */
  councilType?: ProfessionalCouncilType | null;
  councilNumber?: string | null;
  councilUf?: string | null;
  /** Membro criado pelo seed de demonstração (first-contact) — pode ser removido. */
  isDemoSeedMember?: boolean;
};

/** Cargo disponível para a vertical da loja (vindo da API). */
export type TeamRole = {
  roleKey: string;
  label: string;
};

/** Valores do formulário de criação/edição de membro. */
export type TeamMemberFormValues = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  /** IDs CASL concedidos (persistidos no vínculo clínica↔membro). */
  permissions: string[];
};

/** Resultado da criação de um membro (inclui a senha provisória, se gerada). */
export type CreatedTeamMember = {
  member: TeamMember;
  temporaryPassword?: string;
};

/** Resultado do reset de senha de um membro. */
export type ResetPasswordResult = {
  username: string;
  temporaryPassword: string;
};

/** Credenciais provisórias exibidas uma única vez ao operador. */
export type ProvisionalCredentials = {
  username: string;
  password: string;
};
