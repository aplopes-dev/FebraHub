import type { KcContext } from "./KcContext";
import { createGetKcContextMock } from "keycloakify/login/KcContext";

const { getKcContextMock } = createGetKcContextMock({
  kcContextExtension: {},
  kcContextExtensionPerPage: {},
});

const realKcContext = (window as unknown as Record<string, unknown>).kcContext as KcContext | undefined;

// In dev mode, read ?pageId= from URL to navigate between pages.
// In Keycloak, window.kcContext is always defined and this is ignored.
function getDevPageId(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("pageId") ?? "login.ftl";
}

// Dev-only: `?attempted=ana@x.com` simula a re-autenticação (usernameHidden) —
// o Keycloak já sabe quem é o usuário e a tela pede só a senha.
function getDevOverrides(): Record<string, unknown> | undefined {
  const params = new URLSearchParams(window.location.search);
  const attempted = params.get("attempted");
  if (!attempted) return undefined;
  return {
    usernameHidden: true,
    auth: { attemptedUsername: attempted, showUsername: true },
  };
}

export const kcContext: KcContext =
  realKcContext ??
  getKcContextMock({
    pageId: getDevPageId() as Parameters<typeof getKcContextMock>[0]["pageId"],
    overrides: getDevOverrides(),
  });

// Dev-only: URL to switch pages in the browser preview
export const devUrl = (pageId: string) =>
  realKcContext ? undefined : `?pageId=${pageId}`;
