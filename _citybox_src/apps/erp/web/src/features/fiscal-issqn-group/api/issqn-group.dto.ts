export type IssqnGroupDto = {
  id: string;
  name: string;
  issqnServiceCode: string | null;
  issqnNationalCode: string | null;
  issqnRate: number | null;
  issqnTribType: string | null;
  updatedAt: string;
};

export type IssqnGroupListResponseDto = { data: IssqnGroupDto[] };
export type IssqnGroupResponseDto = { data: IssqnGroupDto };

export type IssqnGroupProductDto = {
  productId: string;
  name: string;
  sku: string;
};
export type IssqnGroupProductsResponseDto = { data: IssqnGroupProductDto[] };

export type UpsertIssqnGroupPayload = {
  name: string;
  issqnServiceCode: string;
  issqnNationalCode: string;
  issqnRate: number | null;
  issqnTribType: string;
};
