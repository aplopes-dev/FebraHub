export type NfeIssuanceDto = {
  id: string;
  saleOrderId: string;
  companyId: string;
  accessKey: string | null;
  protocol: string | null;
  status: string;
  environment: string;
  /** Código/mensagem de rejeição do órgão (spec erp/028) — nulos quando AUTHORIZED. */
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NfeIssuanceListResponseDto = { data: NfeIssuanceDto[] };
export type NfeIssuanceResponseDto = { data: NfeIssuanceDto };

export type PreviewedNfeItemDto = {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitValueCents: number;
  totalValueCents: number;
  hasFallbackIcms: boolean;
  hasFallbackPisCofins: boolean;
  hasFallbackIpi: boolean;
};

export type FallbackWarningDto = {
  productId: string;
  productName: string;
  tributo: "ICMS" | "PIS_COFINS" | "IPI";
};

export type NfePreviewDto = {
  saleOrderId: string;
  items: PreviewedNfeItemDto[];
  warnings: FallbackWarningDto[];
  canIssue: boolean;
};

export type NfePreviewResponseDto = { data: NfePreviewDto };

export type IssueNfeCustomerAddressPayload = {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  uf: string;
  cityCodeIbge?: string | null;
  zipCode?: string | null;
};

export type IssueNfeCustomerPayload = {
  documentType: "CPF" | "CNPJ";
  document: string;
  name: string;
  email?: string | null;
  address?: IssueNfeCustomerAddressPayload | null;
};

export type IssueNfePayload = {
  saleOrderId: string;
  customer: IssueNfeCustomerPayload;
};
