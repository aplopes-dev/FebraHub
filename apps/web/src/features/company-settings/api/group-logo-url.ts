import { getActiveScope } from "@/lib/api/active-scope";

const API_PROXY = "/api/proxy/core";

/** URL same-origin para `<img src>` do logotipo do grupo. */
export function groupLogoProxyUrl(cacheKey?: string): string {
  const { organizationId, branchId } = getActiveScope();
  const params = new URLSearchParams();
  if (organizationId) params.set("organizationId", organizationId);
  if (branchId) params.set("branchId", branchId);
  if (cacheKey) params.set("v", cacheKey);
  const query = params.toString();
  return `${API_PROXY}/v1/groups/current/logo${query ? `?${query}` : ""}`;
}
