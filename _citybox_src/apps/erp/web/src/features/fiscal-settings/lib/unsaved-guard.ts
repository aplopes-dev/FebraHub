"use client";

import { useEffect } from "react";

/**
 * Sinalizador de "alterações não salvas" da aba Configurações gerais, num store
 * de módulo (fora do React) para que o container de abas possa consultá-lo antes
 * de trocar de aba sem props atravessando o boundary (spec erp/012, FR-008/SC-005).
 *
 * Multi-fonte: a aba tem dois blocos que editam separadamente (dados gerais e
 * CSC). Cada um registra sua própria chave; a aba está "suja" se qualquer fonte
 * estiver suja. (Escape-hatch imperativo — lido em event handler, não em render.)
 */
const dirtySources = new Set<string>();

function setDirtySource(key: string, isDirty: boolean): void {
  if (isDirty) dirtySources.add(key);
  else dirtySources.delete(key);
}

export function isFiscalSettingsDirty(): boolean {
  return dirtySources.size > 0;
}

/** Confirmação padrão ao sair com alterações pendentes. */
export function confirmDiscardIfDirty(): boolean {
  if (!isFiscalSettingsDirty()) return true;
  return window.confirm(
    "Há alterações não salvas nas Configurações gerais. Deseja sair mesmo assim?",
  );
}

/**
 * Registra a fonte `key` como suja/limpa e avisa antes de recarregar/fechar a
 * página enquanto houver alteração nesta fonte. Efeito que assina o
 * `beforeunload` (sistema externo) e escreve num flag de módulo — não faz setState.
 */
export function useUnsavedChangesGuard(key: string, isDirty: boolean): void {
  useEffect(() => {
    setDirtySource(key, isDirty);
    if (!isDirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      setDirtySource(key, false);
    };
  }, [key, isDirty]);
}
