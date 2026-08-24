import type {
  Variation,
  VariationCalculationProps,
  VariationOptionInput,
  VariationPriceMethod,
} from '../../domain/entities/variation.entity';

export type VariationCalculationDto = VariationCalculationProps;

export type CreateVariationDto = {
  organizationId: string;
  name: string;
  calculation: VariationCalculationDto;
  options: VariationOptionInput[];
};

export type UpdateVariationDto = {
  organizationId: string;
  id: string;
  name: string;
  calculation: VariationCalculationDto;
  options: VariationOptionInput[];
};

export type FindVariationDto = {
  organizationId: string;
  id: string;
};

export type DeleteVariationDto = {
  organizationId: string;
  id: string;
};

export type ListVariationsDto = {
  organizationId: string;
  search?: string;
  page?: number;
  perPage?: number;
};

export type ListVariationsResult = {
  items: Variation[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type { VariationPriceMethod };
