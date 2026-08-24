export type Client = {
  id: string;
  name: string;
  phone: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColorId: string | null;
  createdAt: string;
};

export type ClientFormData = {
  name: string;
  phone: string;
  categoryId?: string | null;
};

export type ClientStats = {
  totalClients: number;
  withCategoryCount: number;
  withoutCategoryCount: number;
};

export type PaginatedClientsResult = {
  data: Client[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  stats: ClientStats;
};
