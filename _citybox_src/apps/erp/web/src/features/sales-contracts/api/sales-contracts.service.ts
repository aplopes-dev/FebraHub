"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type { SalesContractFormValues } from "@/features/sales-contracts/types/sales-contract-form";
import type {
  RecurrenceDuration,
  RecurrenceFrequency,
  SalesContract,
  SalesContractListParams,
  SalesContractListResult,
} from "@/features/sales-contracts/types/sales-contract";
import type { ContractStatus } from "@/features/sales-contracts/types/contract-status";
import type { Customer } from "@/features/customers/types/customer";
import { computeContractTotal } from "@/features/sales-contracts/lib/sales-contract-recurrence";
import { durationFromFormValues } from "@/features/sales-contracts/lib/sales-contract-form-values";

type ContractHttpDto = {
  id: string;
  number: number;
  customerId: string | null;
  customerName: string;
  statusId: string;
  statusName?: string | null;
  sellerName: string;
  startsAt: string;
  endsAt: string | null;
  totalCents: number;
  frequency: string;
  durationType: string;
  durationValue: number;
  firstDueDate: string;
  payloadJson: Record<string, unknown> | null;
  deletedAt?: string | null;
  createdAt: string;
  installments?: Array<{
    id: string;
    sequence: number;
    dueDate: string;
    amountCents: number;
    status: string;
  }>;
};

type StatusHttpDto = { id: string; name: string; sortOrder: number };

type PayloadShape = {
  customerCategoryId?: string | null;
  sellerId?: string;
  statusDetail?: string;
  notes?: string;
  items?: SalesContract["items"];
  paymentMethodId?: string;
  currentPaymentStatus?: SalesContract["currentPaymentStatus"];
  nextDueDate?: string | null;
  duration?: RecurrenceDuration;
  frequency?: RecurrenceFrequency;
};

function asPayload(raw: unknown): PayloadShape {
  if (!raw || typeof raw !== "object") return {};
  return raw as PayloadShape;
}

function mapDuration(
  durationType: string,
  durationValue: number,
  endsAt: string | null,
  payload: PayloadShape,
): RecurrenceDuration {
  if (payload.duration) return payload.duration;
  if (durationType === "indeterminate") return { mode: "forever" };
  if (endsAt) return { mode: "until_date", untilDate: endsAt.slice(0, 10) };
  return { mode: "times", times: durationValue || 12 };
}

export function toSalesContract(dto: ContractHttpDto): SalesContract {
  const payload = asPayload(dto.payloadJson);
  const frequency =
    (payload.frequency as RecurrenceFrequency | undefined) ??
    (dto.frequency === "yearly" ? "yearly" : "monthly");

  return {
    id: dto.id,
    number: dto.number,
    customerId: dto.customerId ?? "",
    customerName: dto.customerName,
    customerCategoryId: payload.customerCategoryId ?? null,
    sellerId: payload.sellerId ?? "",
    sellerName: dto.sellerName,
    startDate: dto.startsAt.slice(0, 10),
    endDate: dto.endsAt ? dto.endsAt.slice(0, 10) : null,
    statusId: dto.statusId,
    statusDetail: payload.statusDetail ?? "",
    notes: payload.notes ?? "",
    items: Array.isArray(payload.items) ? payload.items : [],
    firstDueDate: dto.firstDueDate.slice(0, 10),
    frequency,
    duration: mapDuration(
      dto.durationType,
      dto.durationValue,
      dto.endsAt,
      payload,
    ),
    paymentMethodId: payload.paymentMethodId ?? "",
    currentPaymentStatus: payload.currentPaymentStatus ?? "open",
    nextDueDate: payload.nextDueDate ?? dto.firstDueDate.slice(0, 10),
    totalAmount: dto.totalCents / 100,
    createdAt: dto.createdAt,
    deletedAt: dto.deletedAt ?? null,
  };
}

function apiFrequency(frequency: RecurrenceFrequency): "monthly" | "yearly" {
  return frequency === "yearly" ? "yearly" : "monthly";
}

function formToWritable(
  values: SalesContractFormValues,
  customers: readonly Customer[],
) {
  const customer = customers.find((c) => c.id === values.customerId);
  const duration = durationFromFormValues(values);
  const totalCents = Math.round(computeContractTotal(values.items) * 100);
  const durationType =
    duration.mode === "forever" ? "indeterminate" : "times";
  const durationValue =
    duration.mode === "times"
      ? duration.times
      : duration.mode === "until_date"
        ? 12
        : 1;

  return {
    customerId: values.customerId || undefined,
    customerName: customer?.name?.trim() || "Cliente",
    statusId: values.statusId,
    sellerName: undefined as string | undefined,
    startsAt: values.startDate,
    endsAt: values.endIndefinite ? undefined : values.endDate || undefined,
    totalCents,
    frequency: apiFrequency(values.frequency),
    durationType,
    durationValue,
    firstDueDate: values.firstDueDate,
    payloadJson: {
      customerCategoryId: customer?.categoryId ?? null,
      sellerId: values.sellerId,
      statusDetail: values.statusDetail,
      notes: values.notes,
      items: values.items,
      paymentMethodId: values.paymentMethodId,
      currentPaymentStatus: "open",
      nextDueDate: values.firstDueDate,
      duration,
      frequency: values.frequency,
    },
  };
}

export async function listContractStatusesApi(): Promise<ContractStatus[]> {
  const res = await comercioFetch<{ data: StatusHttpDto[] }>(
    "/v1/contract-statuses",
  );
  return res.data.map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    active: true,
    variant: "secondary" as const,
  }));
}

export async function ensureContractStatusesSeeded(): Promise<ContractStatus[]> {
  const existing = await listContractStatusesApi();
  if (existing.length > 0) return existing;
  const defaults = ["Ativo", "Pausado", "Encerrado"];
  for (let i = 0; i < defaults.length; i += 1) {
    await comercioFetch<StatusHttpDto>("/v1/contract-statuses", {
      method: "POST",
      body: JSON.stringify({ name: defaults[i], sortOrder: i }),
    });
  }
  return listContractStatusesApi();
}

export async function listSalesContractsApi(
  params: SalesContractListParams,
): Promise<SalesContractListResult> {
  const query = new URLSearchParams();
  if (params.search.trim()) query.set("search", params.search.trim());
  query.set("page", "1");
  query.set("perPage", "100");
  const res = await comercioFetch<{
    data: ContractHttpDto[];
    meta: SalesContractListResult["meta"];
  }>(`/v1/sales-contracts?${query}`);

  const all = res.data.map(toSalesContract);
  const tabCounts = {
    active: all.filter((c) => !c.deletedAt).length,
    deleted: all.filter((c) => c.deletedAt).length,
  };
  const filtered = all.filter((c) =>
    params.tab === "deleted" ? Boolean(c.deletedAt) : !c.deletedAt,
  );
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / params.perPage));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * params.perPage;
  return {
    data: filtered.slice(start, start + params.perPage),
    meta: { total, page, perPage: params.perPage, totalPages },
    tabCounts,
  };
}

export async function getSalesContractByIdApi(
  id: string,
): Promise<SalesContract> {
  const dto = await comercioFetch<ContractHttpDto>(`/v1/sales-contracts/${id}`);
  return toSalesContract(dto);
}

export async function createSalesContractApi(
  values: SalesContractFormValues,
  customers: readonly Customer[],
): Promise<SalesContract> {
  const dto = await comercioFetch<ContractHttpDto>("/v1/sales-contracts", {
    method: "POST",
    body: JSON.stringify(formToWritable(values, customers)),
  });
  return toSalesContract(dto);
}

export async function updateSalesContractApi(
  id: string,
  values: SalesContractFormValues,
  customers: readonly Customer[],
): Promise<SalesContract> {
  const dto = await comercioFetch<ContractHttpDto>(
    `/v1/sales-contracts/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(formToWritable(values, customers)),
    },
  );
  return toSalesContract(dto);
}

export async function deleteSalesContractApi(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/sales-contracts/${id}`, { method: "DELETE" });
}
