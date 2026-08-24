"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import {
  toCreatePosTerminalPayload,
  toPosRegister,
  toUpdatePosTerminalPayload,
} from "@/features/pos-registers/api/pos-terminal.mapper";
import type {
  PairingCodeResponseDto,
  PosTerminalListResponseDto,
  PosTerminalResponseDto,
} from "@/features/pos-registers/api/pos-terminal.dto";
import type {
  PosRegister,
  PosRegisterFormValues,
  PosRegisterListParams,
  PosRegisterListResult,
} from "@/features/pos-registers/types/pos-register";

function buildListQuery(params: PosRegisterListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listPosTerminals(
  params: PosRegisterListParams,
): Promise<PosRegisterListResult> {
  const response = await comercioFetch<PosTerminalListResponseDto>(
    `/v1/pos-terminals?${buildListQuery(params)}`,
  );
  return { data: response.data.map(toPosRegister), meta: response.meta };
}

export async function createPosTerminal(
  values: PosRegisterFormValues,
  branchId: string,
): Promise<PosRegister> {
  const response = await comercioFetch<PosTerminalResponseDto>(
    "/v1/pos-terminals",
    {
      method: "POST",
      body: JSON.stringify(toCreatePosTerminalPayload(values, branchId)),
    },
  );
  return toPosRegister(response.data);
}

export async function updatePosTerminal(
  id: string,
  values: PosRegisterFormValues,
): Promise<PosRegister> {
  const response = await comercioFetch<PosTerminalResponseDto>(
    `/v1/pos-terminals/${id}`,
    { method: "PATCH", body: JSON.stringify(toUpdatePosTerminalPayload(values)) },
  );
  return toPosRegister(response.data);
}

export async function setPosTerminalStatus(
  id: string,
  status: PosRegister["status"],
): Promise<PosRegister> {
  const response = await comercioFetch<PosTerminalResponseDto>(
    `/v1/pos-terminals/${id}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
  return toPosRegister(response.data);
}

/**
 * Derruba a credencial do dispositivo pareado. O terminal para de autenticar
 * na chamada seguinte — é o botão de "tablet sumiu".
 */
export async function revokePosTerminalDevice(id: string): Promise<PosRegister> {
  const response = await comercioFetch<PosTerminalResponseDto>(
    `/v1/pos-terminals/${id}/revoke-device`,
    { method: "POST" },
  );
  return toPosRegister(response.data);
}

export async function deletePosTerminal(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/pos-terminals/${id}`, { method: "DELETE" });
}

export async function generatePairingCode(
  id: string,
): Promise<{ code: string; expiresAt: string }> {
  const response = await comercioFetch<PairingCodeResponseDto>(
    `/v1/pos-terminals/${id}/pair`,
    { method: "POST" },
  );
  return response.data;
}
