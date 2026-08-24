"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  IssueNfsePayload,
  NfseIssuanceDto,
  NfseIssuanceListResponseDto,
  NfseIssuanceResponseDto,
} from "./nfse-issuance.dto";

const BASE = "/v1/nfse-issuances";

/**
 * Dados fiscais do tomador. O modelo de `Customer` do erp-web não carrega
 * documento/tipo de pessoa (mapeados fora), então a emissão busca o detalhe cru
 * de `/v1/customers/:id` para montar `documentType`/`document`.
 */
export type CustomerFiscalInfo = {
  documentType: "CPF" | "CNPJ";
  document: string;
  name: string;
  email: string | null;
};

type CustomerDetailRawDto = {
  data: {
    personType: "PF" | "PJ";
    name: string;
    document: string | null;
    email: string | null;
  };
};

export async function getCustomerFiscalInfoApi(
  id: string,
): Promise<CustomerFiscalInfo> {
  const res = await comercioFetch<CustomerDetailRawDto>(`/v1/customers/${id}`);
  const data = res.data;
  return {
    documentType: data.personType === "PJ" ? "CNPJ" : "CPF",
    document: (data.document ?? "").replace(/\D/g, ""),
    name: data.name,
    email: data.email,
  };
}

export async function listNfseIssuancesApi(): Promise<NfseIssuanceDto[]> {
  const res = await comercioFetch<NfseIssuanceListResponseDto>(BASE);
  return res.data;
}

export async function issueNfseApi(
  payload: IssueNfsePayload,
): Promise<NfseIssuanceDto> {
  const res = await comercioFetch<NfseIssuanceResponseDto>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}
