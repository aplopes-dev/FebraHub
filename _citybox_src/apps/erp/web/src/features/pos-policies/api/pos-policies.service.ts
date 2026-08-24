"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  PosPolicy,
  PosPolicyFormValues,
} from "@/features/pos-policies/types/pos-policy";

type PosPolicyResponseDto = { data: PosPolicy };

/**
 * Nunca 404: a API cria a política com os defaults na primeira leitura. Por
 * isso não há tratamento de "ainda não configurado" aqui — se houvesse, esta
 * tela e o PDV inventariam cada um o seu.
 */
export async function getPosPolicy(): Promise<PosPolicy> {
  const response = await comercioFetch<PosPolicyResponseDto>("/v1/pos-policy");
  return response.data;
}

export async function savePosPolicy(
  values: PosPolicyFormValues,
): Promise<PosPolicy> {
  const response = await comercioFetch<PosPolicyResponseDto>("/v1/pos-policy", {
    method: "PUT",
    body: JSON.stringify(values),
  });
  return response.data;
}
