import { getActiveScope } from "@/lib/api/active-scope";
import type { UnitKind } from "@/features/branches/types/branch";

const API_PROXY = "/api/proxy/core";

/** URL same-origin para `<img src>` do logotipo de matriz ou loja. */
export function unitLogoProxyUrl(
  kind: UnitKind,
  unitId: string,
  cacheKey?: string,
): string {
  const { organizationId, branchId } = getActiveScope();
  const collection = kind === "matrix" ? "matrices" : "branches";
  const params = new URLSearchParams();
  if (organizationId) params.set("organizationId", organizationId);
  if (branchId) params.set("branchId", branchId);
  if (cacheKey) params.set("v", cacheKey);
  const query = params.toString();
  return `${API_PROXY}/v1/${collection}/${unitId}/logo${query ? `?${query}` : ""}`;
}
