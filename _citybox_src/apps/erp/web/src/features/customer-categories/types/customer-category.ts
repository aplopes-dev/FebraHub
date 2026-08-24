export type CustomerCategory = {
  id: string;
  name: string;
  discountPercentage: number;
  customerCount: number;
};

export type CustomerCategoryFormValues = Omit<
  CustomerCategory,
  "id" | "customerCount"
>;

export type CustomerCategoryListParams = {
  search: string;
  page: number;
  perPage: number;
};

export type CustomerCategoryListResult = {
  data: CustomerCategory[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};
