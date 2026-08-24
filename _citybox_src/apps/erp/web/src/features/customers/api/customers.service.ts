"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  CustomerListResponseDto,
  CustomerResponseDto,
  SaveCustomerPayload,
} from "@/features/customers/api/customer.dto";
import {
  toCustomerFormValues,
  toCustomerFromDetail,
  toCustomerListItem,
} from "@/features/customers/api/customer.mapper";
import type {
  Customer,
  CustomerListParams,
  CustomerListResult,
} from "@/features/customers/types/customer";
import type { CustomerFormValues } from "@/features/customers/types/customer-form";

const MAX_PER_PAGE = 100;

function buildListQuery(params: CustomerListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listCustomers(
  params: CustomerListParams,
): Promise<CustomerListResult> {
  const response = await comercioFetch<CustomerListResponseDto>(
    `/v1/customers?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toCustomerListItem),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

/** Clientes ativos para selects (pedidos, contratos, etc.). */
/**
 * Clientes para selects de outras telas (lançamentos, conciliação).
 *
 * **Não filtra por estágio de CRM** (FR-044, decisão de 2026-08-14). Antes
 * mandava `tab=active`, que é o estágio "Cliente ativo" — e como a interface
 * não tem nenhum campo para editar o estágio, todo cliente cadastrado pela tela
 * `/clientes` nasce `lead` e ficava permanentemente fora do select. Estágio de
 * CRM descreve funil de vendas, não autorização para receber ou pagar.
 */
export async function listSelectableCustomers(): Promise<Customer[]> {
  const response = await comercioFetch<CustomerListResponseDto>(
    `/v1/customers?page=1&perPage=${MAX_PER_PAGE}`,
  );
  return response.data.map(toCustomerListItem);
}

export async function getCustomerById(id: string): Promise<Customer> {
  const response = await comercioFetch<CustomerResponseDto>(
    `/v1/customers/${id}`,
  );
  return toCustomerFromDetail(response.data);
}

/**
 * Detalhe completo (spec erp/029, edição) — `getCustomerById` mapeia pro
 * shape enxuto da listagem (`Customer`), que descarta documento/endereços/
 * telefones extra. A tela de edição precisa do detalhe cru, mapeado direto
 * para `CustomerFormValues` (o mesmo `CustomerFormView` do cadastro).
 */
export async function getCustomerFormValuesById(
  id: string,
): Promise<CustomerFormValues> {
  const response = await comercioFetch<CustomerResponseDto>(
    `/v1/customers/${id}`,
  );
  return toCustomerFormValues(response.data);
}

export async function createCustomer(
  payload: SaveCustomerPayload,
): Promise<Customer> {
  const response = await comercioFetch<CustomerResponseDto>("/v1/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toCustomerFromDetail(response.data);
}

export async function updateCustomer(
  id: string,
  payload: SaveCustomerPayload,
): Promise<Customer> {
  const response = await comercioFetch<CustomerResponseDto>(
    `/v1/customers/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toCustomerFromDetail(response.data);
}

export async function deleteCustomer(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/customers/${id}`, { method: "DELETE" });
}
