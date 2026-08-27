import type {
  ActorScope,
  GeographicScopeLevel,
  MemberScopeTarget,
} from "@/features/users-permissions/types/user";

const SCOPE_RANK: Record<GeographicScopeLevel, number> = {
  group: 3,
  matrix: 2,
  branch: 1,
};

export function scopeRank(level: GeographicScopeLevel): number {
  return SCOPE_RANK[level];
}

/** Escopo geográfico que um membro representa. */
export function memberScopeTarget(member: {
  scopeLevel: GeographicScopeLevel;
  matrixId: string | null;
  branchIds: string[];
}): MemberScopeTarget {
  return {
    level: member.scopeLevel,
    matrixId: member.matrixId,
    branchIds: [...member.branchIds],
  };
}

/** O ator pode atribuir o escopo alvo ao criar/editar um usuário? */
export function actorCanAssignScope(
  actor: ActorScope,
  target: MemberScopeTarget,
): boolean {
  if (target.level === "group") {
    return actor.level === "group";
  }

  if (target.level === "matrix") {
    if (actor.level === "group") return true;
    if (actor.level === "matrix") {
      return actor.matrixId != null && actor.matrixId === target.matrixId;
    }
    return false;
  }

  // branch
  if (actor.level === "group") return true;
  if (actor.level === "matrix") {
    if (actor.matrixId == null || target.matrixId == null) return false;
    if (actor.matrixId !== target.matrixId) return false;
    return target.branchIds.every((id) => id.length > 0);
  }
  if (actor.level === "branch") {
    if (actor.branchId == null) return false;
    return (
      target.branchIds.length === 1 && target.branchIds[0] === actor.branchId
    );
  }
  return false;
}

/** Opções de escopo disponíveis no formulário conforme o ator. */
export function availableScopeOptions(actor: ActorScope): GeographicScopeLevel[] {
  if (actor.level === "group") return ["group", "matrix", "branch"];
  if (actor.level === "matrix") return ["matrix", "branch"];
  return ["branch"];
}

/** Filtra membros visíveis para o ator logado. */
export function filterMembersByActorScope<
  T extends {
    scopeLevel: GeographicScopeLevel;
    matrixId: string | null;
    branchIds: string[];
  },
>(members: T[], actor: ActorScope): T[] {
  return members.filter((member) => {
    const target = memberScopeTarget(member);
    if (actor.level === "group") return true;
    if (actor.level === "matrix") {
      if (target.level === "group") return false;
      if (target.level === "matrix") {
        return target.matrixId === actor.matrixId;
      }
      return target.matrixId === actor.matrixId;
    }
    // branch actor
    if (target.level === "group" || target.level === "matrix") return false;
    return target.branchIds.includes(actor.branchId ?? "");
  });
}

/** Matrizes que o ator pode atribuir. */
export function availableMatrixIds(
  actor: ActorScope,
  allMatrixIds: string[],
): string[] {
  if (actor.level === "group") return allMatrixIds;
  if (actor.level === "matrix" && actor.matrixId) return [actor.matrixId];
  return [];
}

/** Filiais que o ator pode atribuir (por matriz). */
export function availableBranchIdsForMatrix(
  actor: ActorScope,
  matrixId: string,
  storeIdsByMatrix: Record<string, string[]>,
): string[] {
  const stores = storeIdsByMatrix[matrixId] ?? [];
  if (actor.level === "group") return stores;
  if (actor.level === "matrix") {
    if (actor.matrixId !== matrixId) return [];
    return stores;
  }
  if (actor.level === "branch" && actor.branchId) {
    return stores.includes(actor.branchId) ? [actor.branchId] : [];
  }
  return [];
}

export function defaultScopeForActor(actor: ActorScope): MemberScopeTarget {
  if (actor.level === "group") {
    return { level: "branch", matrixId: null, branchIds: [] };
  }
  if (actor.level === "matrix") {
    return {
      level: "matrix",
      matrixId: actor.matrixId,
      branchIds: [],
    };
  }
  return {
    level: "branch",
    matrixId: actor.matrixId,
    branchIds: actor.branchId ? [actor.branchId] : [],
  };
}
