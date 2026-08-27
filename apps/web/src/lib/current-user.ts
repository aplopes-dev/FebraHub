/**
 * Usuário atual da sessão de trabalho.
 *
 * O app roda **sem autenticação** nesta fase: a camada de login do produto de
 * origem (Keycloak/OAuth) foi removida e a do `apps/api` ainda não existe. Até
 * lá, a identidade é um valor fixo — o header precisa de um nome para exibir e
 * a lista de usuários precisa saber qual linha é "você".
 *
 * Quando a autenticação entrar, este módulo vira o ponto único de troca:
 * `useCurrentUser` passa a ler do provider de sessão e nada mais muda.
 */
export type CurrentUser = {
  name: string;
  email: string;
};

export const CURRENT_USER: CurrentUser = {
  name: "Usuário",
  email: "usuario@febrahub.local",
};

export function useCurrentUser(): CurrentUser {
  return CURRENT_USER;
}
