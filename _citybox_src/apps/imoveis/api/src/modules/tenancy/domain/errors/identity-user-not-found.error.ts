/**
 * O `sub` guardado localmente não existe mais no provedor de identidade.
 *
 * Acontece quando o realm foi recriado ou o usuário removido por fora: o
 * `TeamMember` continua apontando para um `keycloakSub` órfão. É recuperável —
 * quem chama reprovisiona a identidade e regrava o `sub`.
 *
 * Erro de domínio de propósito: o use case precisa distinguir "sumiu" de
 * "Keycloak fora do ar" sem conhecer códigos HTTP do Keycloak.
 */
export class IdentityUserNotFoundError extends Error {
  constructor(readonly sub: string) {
    super(`Identidade ${sub} não existe mais no provedor de identidade`);
    this.name = 'IdentityUserNotFoundError';
  }
}
