/**
 * Modo de cor (claro/escuro) — contrato compartilhado entre servidor e cliente.
 *
 * A escolha vive num **cookie**, e não em `localStorage`, por um motivo só: o
 * servidor precisa saber o modo para renderizar o HTML já na cor certa. Com a
 * escolha só no cliente, o servidor mandava sempre o tema claro, o cliente
 * hidratava no escuro e a página voltava do F5 metade clara, metade escura —
 * até um clique no botão forçar tudo a renderizar de novo.
 */
export type ThemeMode = "light" | "dark";

export const THEME_MODE_COOKIE = "theme";
export const DEFAULT_THEME_MODE: ThemeMode = "light";

/** Um ano — a escolha de tema não deve expirar sozinha. */
export const THEME_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseThemeMode(value: string | undefined | null): ThemeMode {
  return value === "dark" ? "dark" : DEFAULT_THEME_MODE;
}
