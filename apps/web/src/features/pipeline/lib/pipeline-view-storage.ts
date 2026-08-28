"use client";

import type { PipelineView } from "@/features/pipeline/types/pipeline-view";

/**
 * Preferência de visão do funil (quadro ou lista).
 *
 * Formato `subscribe` + snapshot do `useSyncExternalStore`, igual ao
 * `theme/brand-color-store.ts`. É assim, e não com `useEffect` + `setState`,
 * porque o servidor precisa renderizar um valor conhecido: ler o
 * `localStorage` depois da montagem faria a tela abrir em quadro e pular para
 * lista na hidratação.
 */
export const PIPELINE_VIEW_STORAGE_KEY = "app.pipeline-view";
export const PIPELINE_VIEW_CHANGED_EVENT = "pipeline-view-changed";

const DEFAULT_VIEW: PipelineView = "kanban";
const VALID_VIEWS = new Set<PipelineView>(["kanban", "lista"]);

export function subscribePipelineView(onStoreChange: () => void): () => void {
  window.addEventListener(PIPELINE_VIEW_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(PIPELINE_VIEW_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** Snapshot no cliente. Puro: o React o chama a cada render. */
export function readStoredPipelineView(): PipelineView {
  try {
    const stored = window.localStorage.getItem(PIPELINE_VIEW_STORAGE_KEY);
    if (stored && VALID_VIEWS.has(stored as PipelineView)) {
      return stored as PipelineView;
    }
  } catch {
    // navegador sem storage (aba anônima restrita)
  }
  return DEFAULT_VIEW;
}

/** Snapshot no servidor — evita divergência de hidratação. */
export function readDefaultPipelineView(): PipelineView {
  return DEFAULT_VIEW;
}

export function persistPipelineView(view: PipelineView): void {
  try {
    window.localStorage.setItem(PIPELINE_VIEW_STORAGE_KEY, view);
  } catch {
    // quota / modo privado — a escolha vale só nesta sessão
  }
  window.dispatchEvent(new CustomEvent(PIPELINE_VIEW_CHANGED_EVENT, { detail: view }));
}
