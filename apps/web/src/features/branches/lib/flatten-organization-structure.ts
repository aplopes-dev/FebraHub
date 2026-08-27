import type { OrganizationStructure } from "@/features/branches/types/branch";

export function filterOrganizationStructure(
  structure: OrganizationStructure,
  search: string,
): OrganizationStructure {
  const term = search.trim().toLowerCase();
  if (!term) return structure;

  const searchDigits = term.replace(/\D/g, "");

  function matchesUnit(unit: OrganizationStructure["matrices"][number]): boolean {
    const haystack = [
      unit.code,
      unit.displayName,
      unit.legalName,
      unit.tradeName,
      unit.document,
      unit.document.replace(/\D/g, ""),
    ]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(term)) return true;
    return searchDigits.length > 0 && unit.document.replace(/\D/g, "").includes(searchDigits);
  }

  const matrices = structure.matrices.filter(
    (matrix) =>
      matchesUnit(matrix) ||
      (structure.storesByMatrix[matrix.id] ?? []).some(matchesUnit),
  );

  const storesByMatrix: OrganizationStructure["storesByMatrix"] = {};
  for (const matrix of matrices) {
    const stores = structure.storesByMatrix[matrix.id] ?? [];
    storesByMatrix[matrix.id] = matchesUnit(matrix)
      ? stores
      : stores.filter(matchesUnit);
  }

  return {
    groupName: structure.groupName,
    matrices,
    storesByMatrix,
  };
}
