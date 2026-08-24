export type VerticalMemberClinicAssignment = {
  clinicId: string;
  role: string;
};

export type CreateVerticalMemberInput = {
  storeId: string;
  vertical: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string | null;
  assignments: VerticalMemberClinicAssignment[];
};

export type CreateVerticalMemberResult = {
  memberId: string;
  username: string;
  /** Devolvido na resposta para o admin exibir uma única vez. */
  provisionalPassword: string;
};

export type ResetVerticalOwnerPasswordResult = {
  memberId: string;
  username: string;
  /**
   * Devolvido na resposta para o admin exibir **uma única vez**. Nunca é logado, nem vai
   * para corpo de evento, nem é persistido em claro — nem aqui nem na vertical.
   */
  provisionalPassword: string;
};

export type ProvisionVerticalStoreInput = {
  storeId: string;
  vertical: string;
  /** Payload `StorePlatformEventData` — a vertical reusa o mesmo contrato do evento. */
  event: unknown;
};

export type ProvisionVerticalStoreResult = {
  username: string;
  provisionalPassword: string;
};

export type VerticalUnit = {
  id: string;
  name: string;
  isRoot: boolean;
};

/** Vínculo do membro com uma unidade da vertical (na clínica: uma clínica da organização). */
export type VerticalMemberUnitLink = {
  clinicId: string;
  clinicName: string;
  /** Papel **clínico**, por unidade. Não confundir com `organizationRole`. */
  role: string;
  roleLabel: string;
  permissions: string[];
};

/**
 * Membro como a vertical o descreve. Espelha 1:1 o `MembersPresenter.one` da clínica
 * (`apps/verticals/clinica/api/.../members.presenter.ts`) — o platform **não** inventa
 * campo nem reinterpreta papel: ele é só o canal M2M entre o admin e a dona da equipe.
 */
export type VerticalMember = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  status: 'active' | 'disabled';
  /**
   * Eixo organização (responsável x colaborador). É o que distingue o responsável na
   * tela de equipe do admin — por isso é campo obrigatório deste contrato, e não um
   * detalhe opcional que a vertical possa deixar de mandar.
   */
  organizationRole: string;
  organizationRoleLabel: string;
  isOrganizationOwner: boolean;
  hasPassword: boolean;
  provisionalExpiresAt: string | null;
  disabledAt: string | null;
  clinics: VerticalMemberUnitLink[];
};

/**
 * Port de escrita de membro numa `vertical-api` (ADR PLAT-001 §4.5, decisão D1).
 *
 * A escrita é **síncrona**, e não por evento, de propósito: o admin precisa da senha
 * provisória e do erro real (e-mail duplicado, quota estourada) na resposta da tela.
 * Um fluxo assíncrono transformaria isso em "aceito" seguido de uma falha invisível.
 *
 * A direção do acoplamento é `platform → vertical`, que é a correta: a vertical continua
 * podendo ser extraída como produto independente, porque não depende do platform aqui.
 */
export abstract class VerticalMemberProvisioning {
  abstract isSupported(vertical: string): boolean;
  abstract listUnits(
    storeId: string,
    vertical: string,
  ): Promise<VerticalUnit[]>;
  /**
   * **Responsável** da loja como a vertical o conhece — ou `null` se ela não tem um.
   *
   * Devolve só o responsável, e não a equipe inteira, porque foi essa a decisão de
   * produto: pelo admin gerencia-se apenas o responsável da organização; colaborador é
   * assunto do app da vertical. Uma listagem completa aqui só serviria para o platform
   * exibir gente que ele não gerencia.
   *
   * `null` em vez de erro para a tela distinguir "não tem responsável" de "não consegui
   * falar com a vertical" — o segundo caso vira exceção e mensagem própria.
   */
  abstract findOwner(
    storeId: string,
    vertical: string,
  ): Promise<VerticalMember | null>;
  abstract createMember(
    input: CreateVerticalMemberInput,
  ): Promise<CreateVerticalMemberResult>;
  /**
   * Gera nova senha provisória para o **responsável pela organização** daquela loja.
   *
   * Existe porque o Keycloak de desenvolvimento não tem SMTP configurado (não há
   * `smtpServer` no realm importado), então convite por e-mail simplesmente não sai. A
   * decisão de produto foi: o admin mostra a senha uma vez, e o próprio operador a
   * repassa. O platform não escolhe o membro — quem sabe quem é o responsável é a
   * vertical, dona da equipe.
   */
  abstract resetOwnerPassword(
    storeId: string,
    vertical: string,
  ): Promise<ResetVerticalOwnerPasswordResult>;
  /**
   * Provisionamento síncrono sob demanda: cria org/OWNER na vertical e devolve
   * username + senha provisória na mesma resposta (timeout maior que o reset).
   */
  abstract provisionStore(
    input: ProvisionVerticalStoreInput,
  ): Promise<ProvisionVerticalStoreResult>;
}
