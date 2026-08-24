export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  /** CPF do responsável (API: responsibleDocument). */
  document?: string;
  /** Só o contato do proprietário usa celular. */
  mobile?: string;
}

export interface AddressInfo {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
}

export type BillingPersonType = "juridica" | "fisica";

export interface BillingInfo {
  /** "Alterar dados do faturamento" — libera os campos do pagador. */
  overrideEnabled: boolean;
  personType: BillingPersonType;
  /** Razão social (PJ) ou nome completo (PF). */
  legalName: string;
  /** CNPJ (PJ) ou CPF (PF). */
  document: string;
  /** "Adicionar outro endereço" — libera o endereço de cobrança. */
  useCustomAddress: boolean;
  address: AddressInfo;
}

export interface UsageSettings {
  defaultStockSale: string;
  defaultStockPurchase: string;
  defaultPriceListSale: string;
  defaultPriceListPdv: string;
  defaultPriceListService: string;
  defaultPriceListReports: string;
  /** Senha de manutenção dos aplicativos (PDV, KDS, etc.). */
  adminPassword: string;
}

export interface CertificateInfo {
  fileName: string | null;
  password?: string;
  expiryDate?: string | null;
}

export interface PlanInfo {
  name: string;
  status: "active" | "expired" | "pending";
  expiresAt: string;
  price: number;
  usersUsed: number;
  usersLimit: number;
  nfeUsed: number;
  nfeLimit: number;
  diskUsedGb: number;
  diskLimitGb: number;
}

export type CompanyPersonType = "PF" | "PJ";

export interface CompanySettings {
  /** Trecho do id da organização — somente leitura (sem código curto na API). */
  companyCode: string;
  /** PF/PJ — imutável na API. */
  personType: CompanyPersonType;
  legalName: string;
  tradeName: string;
  /** CNPJ (PJ) ou CPF (PF) — somente leitura. */
  cnpj: string;
  /** E-mail comercial da organização (API: email). */
  email: string;
  segment: string;
  phone: string;
  foundationDate: string;
  cnae: string;
  logoUrl: string | null;
  address: AddressInfo;
  financeContact: ContactInfo;
  ownerContact: ContactInfo;
  billing: BillingInfo;
  usage: UsageSettings;
  certificate: CertificateInfo;
  brandColor?: string;
}

export type CompanySettingsTab = "registration" | "billing" | "usage";
