export type IdentityUser = {
  sub: string;
  email: string | null;
  username: string | null;
};

export type CreateIdentityInput = {
  email: string;
  firstName: string;
  lastName: string;
};

export type UpdateIdentityProfileInput = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
};

/**
 * Porta para o provedor de identidade (hoje, Keycloak) — ADR C-17, bloco 4.
 *
 * O domínio só conhece "criar uma identidade e dar a ela uma senha de primeiro
 * acesso" — nada de realms, roles ou tokens. Identidade fora, autorização
 * dentro do Imóveis (`TeamMember.permissions` + CASL).
 *
 * **Divergência declarada em relação ao bloco 4 do ADR:** existe
 * `updateProfile`. O Imóveis edita nome/e-mail do membro em
 * `UpdateTeamMemberUseCase` e precisa refletir isso na identidade; sem o método
 * na porta, o use case voltaria a conhecer o Keycloak. O ERP não tem essa tela.
 * `ensureComercioBackofficeAccess` do ERP **não** existe aqui: com realm por
 * sistema (ADR C-16) estar no realm já é o gate.
 */
export abstract class IdentityProvider {
  abstract findByEmail(email: string): Promise<IdentityUser | null>;

  /** Idempotente: e-mail já existente devolve o `sub` com `created: false`. */
  abstract createUser(
    input: CreateIdentityInput,
  ): Promise<{ sub: string; created: boolean }>;

  /** Lança `IdentityUserNotFoundError` quando o `sub` não existe mais. */
  abstract setProvisionalPassword(sub: string, password: string): Promise<void>;

  abstract setEnabled(sub: string, enabled: boolean): Promise<void>;

  abstract updateProfile(
    sub: string,
    profile: UpdateIdentityProfileInput,
  ): Promise<void>;

  /** Compensação: desfaz uma identidade recém-criada quando o restante falha. */
  abstract deleteUser(sub: string): Promise<void>;
}
