"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  FiscalGroupRichDto,
  FiscalGroupRichListResponseDto,
  FiscalTaxType,
} from "./fiscal-groups.dto";

/** Prefixo de rota HTTP por tributo — mesma nomenclatura das 4 rotas herdadas. */
const ROUTE_PREFIX: Record<FiscalTaxType, string> = {
  ICMS: "fiscal-icms-groups",
  IPI: "fiscal-ipi-groups",
  PIS_COFINS: "fiscal-pis-cofins-groups",
  ISSQN: "fiscal-issqn-groups",
};

export async function listFiscalGroupsRichApi(
  taxType: FiscalTaxType,
): Promise<FiscalGroupRichDto[]> {
  const res = await comercioFetch<FiscalGroupRichListResponseDto>(
    `/v1/fiscal-groups?taxType=${taxType}`,
  );
  return res.data;
}

export async function deleteFiscalGroupApi(
  taxType: FiscalTaxType,
  id: string,
): Promise<void> {
  await comercioFetch<void>(`/v1/${ROUTE_PREFIX[taxType]}/${id}`, {
    method: "DELETE",
  });
}
