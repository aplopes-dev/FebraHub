export type IdentityUser = {
  sub: string;
  email: string | null;
  username: string | null;
};

export type CreateIdentityInput = {
  /**
   * Divergência justificada em relação ao molde do ADR C-17 (bloco 4), onde o
   * e-mail **é** o username: no beautiful, `Member.username` é coluna própria
   * (`@unique`) — derivada do e-mail no responsável da loja, informada à mão no
   * convite de equipe — e o convite aceita membro **sem e-mail**. Por isso o
   * username entra explícito e o e-mail é anulável.
   */
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
};

/**
 * Porta para o provedor de identidade (hoje, Keycloak).
 *
 * O domínio só conhece "criar uma identidade e dar a ela uma senha de primeiro
 * acesso" — nada de realms, roles ou tokens. Identidade fora, autorização
 * dentro do beautiful (`StoreMember.permissions` + CASL).
 *
 * Não há `ensureBeautifulBackofficeAccess`: com um realm por sistema
 * (ADR C-16), **estar no realm `citybox-beautiful` já é o gate de acesso** —
 * `vertical.beautiful.view` e `store_staff` deixaram de existir.
 */
export abstract class IdentityProvider {
  abstract findByEmail(email: string): Promise<IdentityUser | null>;

  /**
   * Idempotente: username ou e-mail já existente devolve o `sub` com
   * `created: false`.
   */
  abstract createUser(
    input: CreateIdentityInput,
  ): Promise<{ sub: string; created: boolean }>;

  abstract setProvisionalPassword(sub: string, password: string): Promise<void>;

  abstract setEnabled(sub: string, enabled: boolean): Promise<void>;

  /** Compensação: desfaz uma identidade recém-criada quando o restante falha. */
  abstract deleteUser(sub: string): Promise<void>;
}
