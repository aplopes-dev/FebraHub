export type Category = {
  id: string;
  name: string;
  productCount: number;
  active: boolean;
};

export type CategoryFormValues = Pick<Category, "name" | "active">;

export type CategoryListParams = {
  search: string;
  page: number;
  perPage: number;
};

export type CategoryListItem = Category;

export type CategoryListResult = {
  data: CategoryListItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};
