import {
  createEmptyCustomerFormValues,
  type CustomerFormValues,
} from "@/features/customers/types/customer-form";

/**
 * Só helpers puros do formulário. O CRUD vive em
 * `features/customers/api/customers.service.ts` (React Query + `comercioFetch`).
 */
export { createEmptyCustomerFormValues };
export type { CustomerFormValues };
