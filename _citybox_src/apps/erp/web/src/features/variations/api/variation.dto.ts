import type { VariationPriceMethod } from "@/features/variations/types/variation";

export type VariationOptionDto = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  priceCents: number;
  code: string;
  sortOrder: number;
};

export type VariationCalculationDto = {
  chooseFrom: number;
  chooseTo: number;
  chargeFromSelectedQuantity: boolean;
  chargeFromQuantity: number;
  priceMethod: VariationPriceMethod;
};

export type VariationDto = {
  id: string;
  name: string;
  productName: string;
  productNames: string[];
  calculation: VariationCalculationDto;
  options: VariationOptionDto[];
  createdAt?: string;
  updatedAt?: string;
};

export type VariationListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type VariationListResponseDto = {
  data: VariationDto[];
  meta: VariationListMetaDto;
};

export type VariationResponseDto = {
  data: VariationDto;
};

export type SaveVariationOptionPayload = {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  priceCents?: number;
  code?: string;
  sortOrder?: number;
};

export type SaveVariationPayload = {
  name: string;
  calculation: VariationCalculationDto;
  options: SaveVariationOptionPayload[];
};
