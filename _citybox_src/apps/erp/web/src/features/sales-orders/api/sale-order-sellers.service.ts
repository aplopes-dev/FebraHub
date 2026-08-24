"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type { SaleOrderSellerOption } from "@/features/sales-orders/types/sale-order-form";

type MemberDto = {
  id: string;
  userId: string;
  name: string;
};

/**
 * Vendedores = membros ativos com `isSeller` (`Usuário vendedor`).
 * O pedido guarda o `userId`, estável mesmo se o vínculo for recriado.
 */
export async function listSaleOrderSellersApi(): Promise<
  SaleOrderSellerOption[]
> {
  const res = await comercioFetch<{ data: MemberDto[] }>(
    "/v1/members?isSeller=true&active=true&perPage=100",
  );

  return res.data.map((member) => ({ id: member.userId, name: member.name }));
}
