import { getActiveScope } from "@/lib/api/active-scope";

const API_PROXY = "/api/proxy/core";

/**
 * URL same-origin para `<img src>` do logotipo.
 *
 * O browser não envia `X-Organization-Id` em tags `<img>` — o escopo ativo
 * vai na query e o BFF promove a header (mesmo padrão da imagem de produto).
 */
export function companyLogoProxyUrl(cacheKey?: string): string {
  const { organizationId, branchId } = getActiveScope();
  const params = new URLSearchParams();
  if (organizationId) params.set("organizationId", organizationId);
  if (branchId) params.set("branchId", branchId);
  if (cacheKey) params.set("v", cacheKey);
  const query = params.toString();
  return `${API_PROXY}/v1/organizations/current/logo${query ? `?${query}` : ""}`;
}
