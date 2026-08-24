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

/**
 * Porta para o provedor de identidade (hoje, Keycloak).
 *
 * O domínio só conhece "criar uma identidade e dar a ela uma senha de primeiro
 * acesso" — nada de realms, roles ou tokens. Isso mantém a fronteira do
 * desenho: identidade fora, autorização dentro do ERP.
 */
export abstract class IdentityProvider {
  abstract findByEmail(email: string): Promise<IdentityUser | null>;

  /** Idempotente: e-mail já existente devolve o `sub` com `created: false`. */
  abstract createUser(
    input: CreateIdentityInput,
  ): Promise<{ sub: string; created: boolean }>;

  abstract setProvisionalPassword(sub: string, password: string): Promise<void>;

  abstract setEnabled(sub: string, enabled: boolean): Promise<void>;

  /** Compensação: desfaz uma identidade recém-criada quando o restante falha. */
  abstract deleteUser(sub: string): Promise<void>;
}
