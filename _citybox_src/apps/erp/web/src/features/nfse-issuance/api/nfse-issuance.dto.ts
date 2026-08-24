export type NfseIssuanceDto = {
  id: string;
  companyId: string;
  externalReference: string;
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

export type NfseIssuanceListResponseDto = { data: NfseIssuanceDto[] };
export type NfseIssuanceResponseDto = { data: NfseIssuanceDto };

export type IssueNfseCustomerAddressPayload = {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  uf: string;
  cityCodeIbge?: string | null;
  zipCode?: string | null;
};

export type IssueNfseCustomerPayload = {
  documentType: "CPF" | "CNPJ";
  document: string;
  name: string;
  email?: string | null;
  address?: IssueNfseCustomerAddressPayload | null;
};

export type IssueNfsePayload = {
  // Sem `companyId`: o erp-api resolve o Emitente pelo CNPJ da organização
  // (isolamento de tenant, spec erp/018). A tela só decide se pode emitir.
  issqnGroupId: string;
  externalReference: string;
  customer: IssueNfseCustomerPayload;
  serviceDescription: string;
  totalValue: number;
  issWithheld: boolean;
};
