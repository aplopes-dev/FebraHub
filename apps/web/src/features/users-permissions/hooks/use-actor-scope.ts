"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ACTOR_SCOPE_STORAGE_KEY,
  DEFAULT_ACTOR_SCOPE,
  readActorScopeFromStorage,
  writeActorScopeToStorage,
} from "@/features/users-permissions/lib/actor-scope-storage";
import type { ActorScope } from "@/features/users-permissions/types/user";

export function useActorScope() {
  const [scope, setScopeState] = useState<ActorScope>(DEFAULT_ACTOR_SCOPE);

  useEffect(() => {
    setScopeState(readActorScopeFromStorage());

    const onStorage = (event: StorageEvent) => {
      if (event.key === ACTOR_SCOPE_STORAGE_KEY) {
        setScopeState(readActorScopeFromStorage());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setScope = useCallback((next: ActorScope) => {
    writeActorScopeToStorage(next);
    setScopeState(next);
    window.dispatchEvent(
      new StorageEvent("storage", { key: ACTOR_SCOPE_STORAGE_KEY }),
    );
  }, []);

  return { scope, setScope };
}
