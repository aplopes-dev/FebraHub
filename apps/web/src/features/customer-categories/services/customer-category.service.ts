import type {
  CustomerCategory,
  CustomerCategoryFormValues,
} from "@/features/customer-categories/types/customer-category";

/**
 * Só helpers puros do formulário. O CRUD vive em
 * `features/customer-categories/api/customer-categories.service.ts`.
 */
export function createEmptyCustomerCategoryFormValues(): CustomerCategoryFormValues {
  return {
    name: "",
    discountPercentage: 0,
  };
}

export function customerCategoryToFormValues(
  category: CustomerCategory,
): CustomerCategoryFormValues {
  return {
    name: category.name,
    discountPercentage: category.discountPercentage,
  };
}
