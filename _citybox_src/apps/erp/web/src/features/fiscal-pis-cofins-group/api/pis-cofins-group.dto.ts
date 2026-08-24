export type PisCofinsGroupDto = {
  id: string;
  name: string;
  pisCst: string | null;
  pisAliquota: number | null;
  cofinsCst: string | null;
  cofinsAliquota: number | null;
  updatedAt: string;
};

export type PisCofinsGroupListResponseDto = { data: PisCofinsGroupDto[] };
export type PisCofinsGroupResponseDto = { data: PisCofinsGroupDto };

export type PisCofinsGroupProductDto = {
  productId: string;
  name: string;
  sku: string;
};
export type PisCofinsGroupProductsResponseDto = {
  data: PisCofinsGroupProductDto[];
};

export type UpsertPisCofinsGroupPayload = {
  name: string;
  pisCst: string;
  pisAliquota: number | null;
  cofinsCst: string;
  cofinsAliquota: number | null;
};
