export type IpiGroupDto = {
  id: string;
  name: string;
  ipiCst: string | null;
  ipiEnquadramento: string | null;
  ipiRate: number | null;
  updatedAt: string;
};

export type IpiGroupListResponseDto = { data: IpiGroupDto[] };
export type IpiGroupResponseDto = { data: IpiGroupDto };

export type IpiGroupProductDto = {
  productId: string;
  name: string;
  sku: string;
};
export type IpiGroupProductsResponseDto = { data: IpiGroupProductDto[] };

export type UpsertIpiGroupPayload = {
  name: string;
  ipiCst: string;
  ipiEnquadramento: string;
  ipiRate: number | null;
};
