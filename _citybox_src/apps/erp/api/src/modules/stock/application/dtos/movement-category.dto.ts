import type {
  MovementCategory,
  MovementCategoryType,
} from '../../domain/entities/movement-category.entity';

export type CreateMovementCategoryDto = {
  organizationId: string;
  name: string;
  type: MovementCategoryType;
  branchIds: string[];
};

export type UpdateMovementCategoryDto = {
  organizationId: string;
  id: string;
  name: string;
  type: MovementCategoryType;
  branchIds: string[];
};

export type ListMovementCategoriesDto = {
  organizationId: string;
  search?: string;
  type?: MovementCategoryType;
  page?: number;
  perPage?: number;
};

export type ListMovementCategoriesResult = {
  items: MovementCategory[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type FindMovementCategoryByIdDto = {
  organizationId: string;
  id: string;
};

export type DeleteMovementCategoryDto = {
  organizationId: string;
  id: string;
};

export type ListMovementCategoryOptionsDto = {
  organizationId: string;
  type?: MovementCategoryType;
};

export type MovementCategoryOption = {
  id: string;
  name: string;
  type: MovementCategoryType;
};
