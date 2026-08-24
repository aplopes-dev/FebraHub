/**
 * Shapes do contrato da `erp-comercio-api` (`/v1/suppliers`) — não usar direto
 * na UI. O tipo de domínio do front (`types/supplier.ts`) diverge em três
 * pontos, traduzidos em `supplier.mapper.ts`:
 * tipo de pessoa (`PF`/`PJ` × `fisica`/`juridica`), campos vazios (`null` × `""`)
 * e unidades atendidas (`branchIds` × `unitIds`).
 */
export type SupplierPersonTypeDto = "PF" | "PJ";

export type SupplierContactDto = {
  email: string | null;
  commercialPhone: string | null;
  mobilePhone: string | null;
};

export type SupplierAddressDto = {
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
};

export type SupplierDto = {
  id: string;
  personType: SupplierPersonTypeDto;
  name: string;
  legalName: string | null;
  document: string;
  stateRegistration: string | null;
  stateExempt: boolean;
  municipalRegistration: string | null;
  sufamaRegistration: string | null;
  /** `yyyy-mm-dd` (coluna `date`, sem hora nem fuso). */
  foundationDate: string | null;
  note: string;
  branchIds: string[];
  contact: SupplierContactDto;
  address: SupplierAddressDto;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupplierListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type SupplierTabCountsDto = {
  active: number;
  deleted: number;
};

export type SupplierListResponseDto = {
  data: SupplierDto[];
  meta: SupplierListMetaDto;
  tabCounts: SupplierTabCountsDto;
};

export type SupplierResponseDto = {
  data: SupplierDto;
};

/**
 * Corpo de `POST`/`PUT`: **flat**, ao contrário da resposta, que aninha contato
 * e endereço. Campos opcionais omitidos são limpos (semântica de PUT da API),
 * por isso o mapper omite string vazia em vez de mandar `""` — `email` e
 * `foundationDate` são validados no backend e recusariam o valor vazio.
 */
export type SaveSupplierPayload = {
  personType: SupplierPersonTypeDto;
  name: string;
  legalName?: string;
  document: string;
  stateRegistration?: string;
  stateExempt?: boolean;
  municipalRegistration?: string;
  sufamaRegistration?: string;
  foundationDate?: string;
  note?: string;
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
