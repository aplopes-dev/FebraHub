"use client";

import { useSyncExternalStore } from "react";
import {
  getKdsSnapshot,
  subscribeKds,
} from "@/features/kds/services/kds.service";
import type { Kds } from "@/features/kds/types/kds";

/**
 * Snapshot do store in-memory de KDS.
 *
 * `useSyncExternalStore` no lugar de um contador de "revision": as telas
 * re-renderizam sozinhas a cada mutação, sem `setState` em efeito.
 */
export function useKdsStore(): Kds[] {
  return useSyncExternalStore(subscribeKds, getKdsSnapshot, getKdsSnapshot);
}
