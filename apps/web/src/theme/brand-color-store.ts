"use client";

import { appDefaultBrandColor } from "./app-theme";
import { isBrandColor } from "./brand-color";

/**
 * Cor de marca escolhida pelo usuário: `localStorage` + evento.
 *
 * Vive no tema, e não na feature de configurações, porque quem consome é o
 * provider raiz (`AppProviders`) — a tela de Dados da empresa é só quem
 * escreve. O formato (`subscribe` / snapshot) é o de `useSyncExternalStore`.
 *
 * Passa a ser um campo da empresa na API quando ela existir; até lá, a escolha
 * é por navegador.
 */
export const BRAND_COLOR_STORAGE_KEY = "febrahub.brand-color";

/**
 * Chave do produto de origem. Quem usou aquele app tem uma cor dele salva
 * aqui, e ela sequestrava a marca do FebraHub logo após a hidratação: a página
 * abria no ouro e virava laranja. A chave nova nasce vazia; esta é apagada na
 * primeira leitura, para o resíduo não voltar em outra aba.
 */
const LEGACY_STORAGE_KEY = "company_brand_color";

export const BRAND_COLOR_CHANGED_EVENT = "brand-color-changed";

/**
 * Apaga o resíduo do produto de origem. Roda na assinatura, e não na leitura:
 * o snapshot do `useSyncExternalStore` é chamado a cada render e precisa ser
 * puro.
 */
function purgeLegacyBrandColor(): void {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // navegador sem storage — nada a limpar
  }
}

/** Assina mudanças da cor salva (nesta aba, pelo evento; em outras, `storage`). */
export function subscribeBrandColor(onStoreChange: () => void): () => void {
  purgeLegacyBrandColor();
  window.addEventListener(BRAND_COLOR_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(BRAND_COLOR_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/**
 * Snapshot no client.
 *
 * Só uma cor do catálogo passa: um hex qualquer sobrando no storage não é
 * escolha de ninguém — é resíduo — e a marca do sistema vale mais que ele.
 */
export function readStoredBrandColor(): string {
  try {
    const stored = localStorage.getItem(BRAND_COLOR_STORAGE_KEY);
    if (stored && isBrandColor(stored)) return stored.toUpperCase();

    return appDefaultBrandColor;
  } catch {
    // navegador sem storage (aba anônima restrita)
    return appDefaultBrandColor;
  }
}

/** Snapshot no servidor — evita divergência de hidratação. */
export function readDefaultBrandColor(): string {
  return appDefaultBrandColor;
}

export function persistBrandColor(brandColor: string): void {
  localStorage.setItem(BRAND_COLOR_STORAGE_KEY, brandColor);
  window.dispatchEvent(
    new CustomEvent(BRAND_COLOR_CHANGED_EVENT, { detail: brandColor }),
  );
}
