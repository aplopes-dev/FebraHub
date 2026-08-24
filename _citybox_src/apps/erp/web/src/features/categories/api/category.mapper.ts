import type { ProductCategoryDto } from "./category.dto";
import type { Category, CategoryListItem } from "@/features/categories/types/category";

export function toCategory(dto: ProductCategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    active: dto.active,
    productCount: dto.productCount ?? 0,
  };
}

export function toCategoryListItem(dto: ProductCategoryDto): CategoryListItem {
  return toCategory(dto);
}
