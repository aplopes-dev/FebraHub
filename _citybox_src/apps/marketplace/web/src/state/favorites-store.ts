import { useSyncExternalStore } from 'react';
import { cityboxApi } from '@/api/citybox-api';

/**
 * Store de favoritos isolada (fora do React Context) para **isolamento por item**:
 * cada `<FavoriteButton>` assina apenas `has(id)` via `useSyncExternalStore`, então
 * togglar um favorito re-renderiza só aquele botão — não as listas de produtos.
 */
let favs = new Set<string>();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Snapshot estável da lista de ids (evita loop no useSyncExternalStore).
let idsSnapshot: string[] = [];
let idsKey = '';
function getIdsSnapshot(): string[] {
  const key = [...favs].sort().join('|');
  if (key !== idsKey) {
    idsKey = key;
    idsSnapshot = [...favs];
  }
  return idsSnapshot;
}

export const favoritesStore = {
  /** Substitui o conjunto inteiro (ex.: após login / sync). */
  setAll(ids: string[]) {
    favs = new Set(ids);
    emit();
  },
  /** Limpa (ex.: logout). */
  clear() {
    favs = new Set();
    emit();
  },
  has(id: string) {
    return favs.has(id);
  },
  ids() {
    return getIdsSnapshot();
  },
  /** Optimistic toggle + persistência; reverte em erro. */
  toggle(id: string) {
    const next = !favs.has(id);
    favs = new Set(favs);
    if (next) favs.add(id);
    else favs.delete(id);
    emit();

    void cityboxApi.toggleFavorite(id, next).catch(() => {
      favs = new Set(favs);
      if (next) favs.delete(id);
      else favs.add(id);
      emit();
    });
  },
};

/** Assina só o status de UM produto — re-renderiza apenas quando ESSE id muda. */
export function useIsFavorite(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => favs.has(id),
    () => false,
  );
}

/** Assina a lista completa de ids favoritados (para a página de Favoritos). */
export function useFavoriteIds(): string[] {
  return useSyncExternalStore(subscribe, getIdsSnapshot, getIdsSnapshot);
}
