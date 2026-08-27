import type { ActorScope } from "@/features/users-permissions/types/user";
import { MOCK_ACTOR_SCOPE_HEADER } from "@/lib/mock/mock-users-permissions";

export const ACTOR_SCOPE_STORAGE_KEY = "app.mock-actor-scope";

export const DEFAULT_ACTOR_SCOPE: ActorScope = {
  level: "group",
  matrixId: null,
  branchId: null,
};

export function readActorScopeFromStorage(): ActorScope {
  if (typeof window === "undefined") return DEFAULT_ACTOR_SCOPE;
  try {
    const raw = sessionStorage.getItem(ACTOR_SCOPE_STORAGE_KEY);
    if (!raw) return DEFAULT_ACTOR_SCOPE;
    const parsed = JSON.parse(raw) as ActorScope;
    if (
      parsed.level === "group" ||
      parsed.level === "matrix" ||
      parsed.level === "branch"
    ) {
      return {
        level: parsed.level,
        matrixId: parsed.matrixId ?? null,
        branchId: parsed.branchId ?? null,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_ACTOR_SCOPE;
}

export function writeActorScopeToStorage(scope: ActorScope): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACTOR_SCOPE_STORAGE_KEY, JSON.stringify(scope));
}

export function applyActorScopeHeader(headers: Headers): void {
  const scope = readActorScopeFromStorage();
  headers.set(MOCK_ACTOR_SCOPE_HEADER, JSON.stringify(scope));
}
