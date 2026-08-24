/**
 * Shapes do contrato da `erp-comercio-api` (`/v1/carriers`) — não usar direto
 * na UI. O tipo de domínio do front (`types/carrier.ts`) diverge em vários
 * pontos, traduzidos em `carrier.mapper.ts`: tipo de pessoa (`PF`/`PJ` ×
 * `fisica`/`juridica`), nome (`name` × `tradeName`), campos vazios (`null` ×
 * `""`), unidades atendidas (`branchIds` × `unitIds`) e os campos fiscais
 * (`icmsExempt`/`registerInNfe`/`stateExempt` soltos × objeto `fiscal`
 * aninhado). `additionalPhone` não existe na API — é descartado ao salvar.
 */
export type CarrierPersonTypeDto = "PF" | "PJ";

export type CarrierDeliveryTypeDto = "transportadora" | "entregador";

export type CarrierContactDto = {
  email: string | null;
  commercialPhone: string | null;
  mobilePhone: string | null;
};

export type CarrierAddressDto = {
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
};

export type CarrierDto = {
  id: string;
  personType: CarrierPersonTypeDto;
  deliveryType: CarrierDeliveryTypeDto;
  name: string;
  legalName: string | null;
  document: string;
  icmsExempt: boolean;
  registerInNfe: boolean;
  stateExempt: boolean;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  branchIds: string[];
  contact: CarrierContactDto;
  address: CarrierAddressDto;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CarrierListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type CarrierTabCountsDto = {
  active: number;
  deleted: number;
};

export type CarrierListResponseDto = {
  data: CarrierDto[];
  meta: CarrierListMetaDto;
  tabCounts: CarrierTabCountsDto;
};

export type CarrierResponseDto = {
  data: CarrierDto;
};

/**
 * Corpo de `POST`/`PUT`: **flat**, ao contrário da resposta, que aninha
 * contato e endereço. Campos opcionais omitidos são limpos (semântica de PUT
 * da API), por isso o mapper omite string vazia em vez de mandar `""`.
 */
export type SaveCarrierPayload = {
  personType: CarrierPersonTypeDto;
  deliveryType: CarrierDeliveryTypeDto;
  name: string;
  legalName?: string;
  document: string;
  icmsExempt?: boolean;
  registerInNfe?: boolean;
  stateExempt?: boolean;
  stateRegistration?: string;
  municipalRegistration?: string;
  email?: string;
  commercialPhone?: string;
  mobilePhone?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  branchIds?: string[];
};
