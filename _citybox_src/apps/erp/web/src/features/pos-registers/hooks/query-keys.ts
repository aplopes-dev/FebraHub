import type { PosRegisterListParams } from "@/features/pos-registers/types/pos-register";

/**
 * Chaves de cache dos terminais de PDV. Toda chave começa pelo `scope`
 * (empresa + unidade ativa) para que trocar de uma ou de outra isole o cache
 * automaticamente — sem isso, a tela mostraria dados da anterior.
 */
export const posTerminalKeys = {
  all: (scope: string) => ["comercio", "pos-terminals", scope] as const,
  lists: (scope: string) => [...posTerminalKeys.all(scope), "list"] as const,
  list: (scope: string, params: PosRegisterListParams) =>
    [...posTerminalKeys.lists(scope), params] as const,
};
