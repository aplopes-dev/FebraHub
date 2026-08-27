export type FiscalInfoDto = {
  ncm: string;
  origin: string;
  netWeightKg: number;
  grossWeightKg: number;
  cest: string;
  fcpPercent: number;
  fcpStPercent: number;
  fcpStRetainedPercent: number;
  cstIbsCbs: string;
  taxClassification: string;
};

export type FiscalGroupFieldDto = {
  value: string;
  applyToAll: boolean;
};

export type FiscalGroupDto = {
  icms: FiscalGroupFieldDto;
  pisCofins: FiscalGroupFieldDto;
  ipi: FiscalGroupFieldDto;
  cfop: FiscalGroupFieldDto;
  issqn: FiscalGroupFieldDto;
};

export type FiscalUnitDto = {
  branchId: string;
  icms: string;
  pisCofins: string;
  ipi: string;
  cfop: string;
  issqn: string;
};

export type FiscalParameterListItemDto = {
  id: string;
  name: string;
  sku: string;
  /** Sempre `null` — object key do MinIO não é URL pública. */
  imageUrl: null;
  /** True quando há imagem no MinIO (`GET /v1/products/:id/image`). */
  hasImage: boolean;
  category: string;
  configured: boolean;
};

export type FiscalParameterListResponseDto = {
  data: FiscalParameterListItemDto[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: {
    all: number;
    pending: number;
  };
};

export type FiscalParameterDetailDto = {
  id: string;
  name: string;
  sku: string;
  /** Sempre `null` — object key do MinIO não é URL pública. */
  imageUrl: null;
  /** True quando há imagem no MinIO (`GET /v1/products/:id/image`). */
  hasImage: boolean;
  category: string;
  configured: boolean;
  info: FiscalInfoDto;
  group: FiscalGroupDto;
  units: FiscalUnitDto[];
};

export type FiscalParameterDetailResponseDto = {
  data: FiscalParameterDetailDto;
};

export type UpsertFiscalParametersPayload = {
  info: FiscalInfoDto;
  group: FiscalGroupDto;
  units: FiscalUnitDto[];
};
