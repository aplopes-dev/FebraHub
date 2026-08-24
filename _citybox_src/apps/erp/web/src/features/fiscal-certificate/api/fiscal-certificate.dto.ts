import type { CertificateStatus } from "../types/certificate";

/** Item de certificado como a fiscal-api devolve. */
export type CertificateDto = {
  id: string;
  companyId: string;
  type: string;
  name: string | null;
  subjectCnpj: string;
  validFrom: string;
  validUntil: string;
  status: CertificateStatus;
  createdAt: string;
};

export type CertificateListResponseDto = { data: CertificateDto[] };
export type CertificateResponseDto = { data: CertificateDto };

/** `GET /certificates/{id}/status`. */
export type CertificateStatusDto = {
  status: CertificateStatus;
  validUntil: string;
  daysUntilExpiration: number;
};
export type CertificateStatusResponseDto = { data: CertificateStatusDto };

/**
 * `POST /v1/companies` responde com `CompanyPresenter.toHttp(company)`, que
 * **envelopa em `{ data }`** (igual às demais rotas — verificado em
 * `company.presenter.ts`). Só precisamos do `id`.
 */
export type CreatedCompanyDto = { data: { id: string } };
