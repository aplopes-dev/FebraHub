import type { PosModuleStateMap } from '../../domain/services/resolve-terminal-modules';

export type GetPosModuleDefaultsDto = { organizationId: string };

/** PATCH-like: campo ausente não muda. Não há "criar" — há sempre um. */
export type UpsertPosModuleDefaultsDto = {
  organizationId: string;
  /** Aplicar um perfil pronto **substitui** o conjunto inteiro. */
  applyProfile?: string;
  modules?: Record<string, unknown>;
};

export type GetTerminalModulesDto = {
  organizationId: string;
  terminalId: string;
};

/** `modules: null` volta a herdar o padrão da loja. */
export type UpsertTerminalModulesDto = {
  organizationId: string;
  terminalId: string;
  modules: Record<string, unknown> | null;
};

/**
 * O que sai das rotas de leitura.
 *
 * Carrega o **resolvido** e, separadamente, se o terminal herda — a tela
 * precisa do segundo para mostrar "Usar o padrão da loja" ligado sem ter de
 * comparar dois mapas e adivinhar.
 */
export type TerminalModulesResult = {
  terminalId: string;
  /** Padrão + sobrescrita, com núcleo forçado. É o que o PDV aplica. */
  resolved: PosModuleStateMap;
  /** `true` = sem sobrescrita própria; acompanha o padrão da loja. */
  inheritsDefaults: boolean;
};
