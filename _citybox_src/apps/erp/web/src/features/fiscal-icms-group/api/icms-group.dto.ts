export type UfRateType = "INTERNA" | "INTERESTADUAL";

export type IcmsUfRateDto = {
  uf: string;
  rateType: UfRateType;
  aliquota: number;
};

export type IcmsGroupListItemDto = {
  id: string;
  name: string;
  icmsCst: string | null;
  icmsCsosn: string | null;
  updatedAt: string;
};

export type IcmsGroupDetailDto = IcmsGroupListItemDto & {
  ufRates: IcmsUfRateDto[];
};

export type IcmsGroupListResponseDto = { data: IcmsGroupListItemDto[] };
export type IcmsGroupResponseDto = { data: IcmsGroupDetailDto };

export type IcmsGroupProductDto = {
  productId: string;
  name: string;
  sku: string;
};
export type IcmsGroupProductsResponseDto = { data: IcmsGroupProductDto[] };

export type UpsertIcmsGroupPayload = {
  name: string;
  icmsCst: string | null;
  icmsCsosn: string | null;
  ufRates: IcmsUfRateDto[];
};
