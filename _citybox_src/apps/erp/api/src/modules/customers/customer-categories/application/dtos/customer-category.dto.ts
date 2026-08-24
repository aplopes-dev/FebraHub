import type { CustomerCategory } from '../../domain/entities/customer-category.entity';

export type CreateCustomerCategoryDto = {
  organizationId: string;
  name: string;
  discountPercentage?: number;
};

export type UpdateCustomerCategoryDto = {
  organizationId: string;
  id: string;
  name: string;
  discountPercentage: number;
};

export type DeleteCustomerCategoryDto = {
  organizationId: string;
  id: string;
};

export type FindCustomerCategoryByIdDto = {
  organizationId: string;
  id: string;
};

export type ListCustomerCategoriesDto = {
  organizationId: string;
  search?: string;
  page?: number;
  perPage?: number;
};

export type CustomerCategoryListItem = {
  category: CustomerCategory;
  customerCount: number;
};

export type ListCustomerCategoriesResult = {
  items: CustomerCategoryListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
