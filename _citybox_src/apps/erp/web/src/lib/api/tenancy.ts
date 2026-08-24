"use client";

import { fetchWithSession } from "@/lib/auth-fetch";

const COMERCIO_PROXY = "/api/proxy/comercio";

export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER";

export type OrganizationOption = {
  id: string;
  document: string;
  legalName: string;
  tradeName: string | null;
  displayName: string;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  /** Papel do usuário logado nesta organização. */
  role: MembershipRole;
  branchCount: number;
};

export type BranchOption = {
  id: string;
  code: string;
  displayName: string;
  isHeadquarters: boolean;
  active: boolean;
  city: string | null;
  state: string | null;
};

export class TenancyApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "TenancyApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchWithSession(`${COMERCIO_PROXY}${path}`, init);
  if (!res.ok) {
    throw new TenancyApiError(res.status, await extractMessage(res));
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function extractMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: { message?: string } | string;
      message?: string | string[];
    };
    if (typeof data.error === "string") return data.error;
    if (data.error?.message) return data.error.message;
    if (Array.isArray(data.message)) return data.message.join("; ");
    if (typeof data.message === "string") return data.message;
  } catch {
    // resposta sem corpo JSON
  }
  return `Erro ao consultar a API (${res.status})`;
}

/**
 * Organizações em que o usuário tem vínculo ativo.
 *
 * Não manda `X-Organization-Id`: é a rota que roda **antes** de haver
 * organização ativa (`@SkipTenant` na API).
 */
export async function fetchMyOrganizations(): Promise<OrganizationOption[]> {
  const body = await request<{ data: OrganizationOption[] }>("/v1/organizations");
  return body.data ?? [];
}

type BranchResponse = {
  id: string;
  code: string;
  displayName: string;
  isHeadquarters: boolean;
  active: boolean;
  address?: { city?: string | null; state?: string | null } | null;
};

/** Unidades da organização informada — só as ativas e não excluídas. */
export async function fetchBranches(
  organizationId: string,
): Promise<BranchOption[]> {
  const body = await request<{ data: BranchResponse[] }>(
    "/v1/branches?active=true&perPage=100",
    { headers: { "X-Organization-Id": organizationId } },
  );

  return (body.data ?? []).map((branch) => ({
    id: branch.id,
    code: branch.code,
    displayName: branch.displayName,
    isHeadquarters: branch.isHeadquarters,
    active: branch.active,
    city: branch.address?.city ?? null,
    state: branch.address?.state ?? null,
  }));
}
