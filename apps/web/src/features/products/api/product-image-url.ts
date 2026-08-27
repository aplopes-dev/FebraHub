import { getActiveScope } from "@/lib/api/active-scope";

const API_PROXY = "/api/proxy/core";

/**
 * URL same-origin para `<img src>`.
 *
 * O browser **não** envia `X-Organization-Id` em tags `<img>` — por isso o
 * escopo ativo vai na query (`organizationId` / `branchId`). O proxy BFF
 * promove esses params a headers antes de chamar a API (padrão food `?storeId=`).
 */
export function productImageProxyUrl(productId: string): string {
  const { organizationId, branchId } = getActiveScope();
  const params = new URLSearchParams();
  if (organizationId) params.set("organizationId", organizationId);
  if (branchId) params.set("branchId", branchId);
  const query = params.toString();
  return `${API_PROXY}/v1/products/${productId}/image${query ? `?${query}` : ""}`;
}
