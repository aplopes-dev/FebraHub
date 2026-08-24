"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import { resolveCityCodeIbge } from "@/lib/ibge-lookup";
import type { SaleOrderListResponseDto } from "@/features/sales-orders/api/sale-order.dto";
import type {
  IssueNfeCustomerAddressPayload,
  IssueNfePayload,
  NfeIssuanceDto,
  NfeIssuanceListResponseDto,
  NfeIssuanceResponseDto,
  NfePreviewDto,
  NfePreviewResponseDto,
} from "./nfe-issuance.dto";
import type { CustomerNfeFiscalInfo } from "./customer-nfe-fiscal-info.dto";

const BASE = "/v1/nfe-issuances";

type CustomerAddressRawDto = {
  addressType: "principal" | "entrega" | "outro";
  zipCode: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  complement: string | null;
};

type CustomerDetailWithAddressRawDto = {
  data: {
    personType: "PF" | "PJ";
    name: string;
    document: string | null;
    email: string | null;
    addresses: CustomerAddressRawDto[];
  };
};

/**
 * Endereço "de referência" para a NF-e (spec erp/028, plan.md D1): o cliente
 * pode ter mais de um endereço (`principal`/`entrega`/`outro`); usa o
 * `principal` — se não houver nenhum com esse tipo, cai no primeiro da lista
 * (ordem de cadastro). Sem endereço ou com campo obrigatório ausente ou
 * cidade fora da tabela IBGE estática → `null` (endereço "não utilizável").
 */
function resolveReferenceAddress(
  addresses: CustomerAddressRawDto[],
): IssueNfeCustomerAddressPayload | null {
  const chosen =
    addresses.find((address) => address.addressType === "principal") ??
    addresses[0] ??
    null;
  if (!chosen) return null;
  if (!chosen.street || !chosen.number || !chosen.district || !chosen.city || !chosen.state) {
    return null;
  }
  const cityCodeIbge = resolveCityCodeIbge(chosen.city, chosen.state);
  if (!cityCodeIbge) return null;

  return {
    street: chosen.street,
    number: chosen.number,
    complement: chosen.complement,
    district: chosen.district,
    city: chosen.city,
    uf: chosen.state,
    cityCodeIbge,
    zipCode: chosen.zipCode,
  };
}

/**
 * Dados fiscais do tomador para a NF-e (spec erp/028) — resolvedor próprio,
 * distinto de `getCustomerFiscalInfoApi` (`nfse-issuance`), que não carrega
 * endereço (a NFS-e não precisa; a NF-e exige `enderDest`). Mesma origem
 * (`GET /v1/customers/:id`), só a leitura de `addresses[]` é nova.
 */
export async function getCustomerNfeFiscalInfoApi(
  id: string,
): Promise<CustomerNfeFiscalInfo> {
  const res = await comercioFetch<CustomerDetailWithAddressRawDto>(
    `/v1/customers/${id}`,
  );
  const data = res.data;
  return {
    documentType: data.personType === "PJ" ? "CNPJ" : "CPF",
    document: (data.document ?? "").replace(/\D/g, ""),
    name: data.name,
    email: data.email,
    address: resolveReferenceAddress(data.addresses ?? []),
  };
}

/** Pedido de venda elegível para emissão (fechado) — só os campos que a
 * Autocomplete da tela precisa, não o `SaleOrderDetail` completo. */
export type EligibleSaleOrder = {
  id: string;
  number: number;
  customerId: string | null;
  customerName: string;
  totalCents: number;
};

/** Pedidos fechados (`status=closed`) — a exclusão dos que já têm NF-e emitida
 * é feita no backend via `NfePreview.canIssue`, não aqui (evita 2 chamadas na
 * lista; a tela confirma `canIssue` só ao selecionar). */
export async function listEligibleSaleOrdersApi(
  search: string,
): Promise<EligibleSaleOrder[]> {
  const query = new URLSearchParams({
    tab: "open",
    perPage: "50",
    page: "1",
    sort: "created_at_desc",
  });
  query.append("statuses", "closed");
  if (search.trim()) query.set("search", search.trim());

  const res = await comercioFetch<SaleOrderListResponseDto>(
    `/v1/sale-orders?${query}`,
  );
  return res.data.map((item) => ({
    id: item.id,
    number: item.number,
    customerId: item.customerId,
    customerName: item.customerName,
    totalCents: item.totalCents,
  }));
}

export async function previewNfeIssuanceApi(
  saleOrderId: string,
): Promise<NfePreviewDto> {
  const query = new URLSearchParams({ saleOrderId });
  const res = await comercioFetch<NfePreviewResponseDto>(
    `${BASE}/preview?${query}`,
  );
  return res.data;
}

export async function listNfeIssuancesApi(): Promise<NfeIssuanceDto[]> {
  const res = await comercioFetch<NfeIssuanceListResponseDto>(BASE);
  return res.data;
}

export async function issueNfeApi(
  payload: IssueNfePayload,
): Promise<NfeIssuanceDto> {
  const res = await comercioFetch<NfeIssuanceResponseDto>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}
