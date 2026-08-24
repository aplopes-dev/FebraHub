"use client";

import { fiscalFetch, fiscalUpload } from "@/lib/api/fiscal-client";
import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  BranchDto,
  BranchListResponseDto,
} from "@/features/branches/api/branch.dto";
import type { OrganizationCurrentResponseDto } from "@/features/company-settings/api/organization-current.dto";
import type { Certificate } from "../types/certificate";
import type { ProvisionCompanyPayload } from "../types/certificate";
import { toCertificate } from "./fiscal-certificate.mapper";
import type {
  CertificateListResponseDto,
  CertificateResponseDto,
  CertificateStatusResponseDto,
  CreatedCompanyDto,
} from "./fiscal-certificate.dto";

/** Lista os certificados do Emitente. */
export async function listCertificatesApi(
  companyId: string,
): Promise<Certificate[]> {
  const res = await fiscalFetch<CertificateListResponseDto>(
    `/v1/companies/${companyId}/certificates`,
  );
  return res.data.map(toCertificate);
}

/**
 * Dias até o vencimento de um certificado (`GET /certificates/{id}/status`).
 * `companyId` vai como query (BUG-03, 2026-08-13): a rota não tem `companyId`
 * no path, então o proxy `/api/proxy/fiscal` não saberia validar o dono sem
 * ele — com o parâmetro, reusa a mesma checagem das rotas `/v1/companies/:id`.
 */
export async function getCertificateStatusApi(
  certificateId: string,
  companyId: string,
): Promise<{ daysUntilExpiration: number }> {
  const query = new URLSearchParams({ companyId });
  const res = await fiscalFetch<CertificateStatusResponseDto>(
    `/v1/certificates/${certificateId}/status?${query}`,
  );
  return { daysUntilExpiration: res.data.daysUntilExpiration };
}

/** Upload multipart do certificado. A senha viaja no FormData e não é persistida. */
export async function uploadCertificateApi(
  companyId: string,
  input: { file: File; password: string; name?: string },
): Promise<Certificate> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("password", input.password);
  if (input.name?.trim()) form.append("name", input.name.trim());

  const res = await fiscalUpload<CertificateResponseDto>(
    `/v1/companies/${companyId}/certificates`,
    form,
  );
  return toCertificate(res.data);
}

/** Provisiona o Emitente. Resposta envelopada em `{ data }` (só o id importa). */
export async function createCompanyApi(
  payload: ProvisionCompanyPayload,
): Promise<{ id: string }> {
  const res = await fiscalFetch<CreatedCompanyDto>("/v1/companies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { id: res.data.id };
}

/** Filial matriz (`isHeadquarters: true`) da organização ativa; `null` se não houver. */
export async function getHeadquartersBranchApi(): Promise<BranchDto | null> {
  const res = await comercioFetch<BranchListResponseDto>(
    "/v1/branches?active=true&perPage=100",
  );
  return res.data.find((branch) => branch.isHeadquarters) ?? null;
}

/** `platformStoreId` da organização ativa (para provisionar o Emitente). */
export async function getPlatformStoreIdApi(): Promise<string | null> {
  const res = await comercioFetch<OrganizationCurrentResponseDto>(
    "/v1/organizations/current",
  );
  return res.data.platformStoreId ?? null;
}
