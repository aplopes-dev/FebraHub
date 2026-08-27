import type {
  Supplier,
  SupplierFormValues,
} from "@/features/suppliers/types/supplier";

/**
 * Só os helpers puros do formulário. O CRUD vive em
 * `features/suppliers/api/suppliers.service.ts` (React Query + `apiFetch`).
 */
export function createEmptySupplierFormValues(): SupplierFormValues {
  return {
    personType: "juridica",
    name: "",
    legalName: "",
    document: "",
    stateRegistration: "",
    stateExempt: false,
    municipalRegistration: "",
    sufamaRegistration: "",
    foundationDate: "",
    unitIds: [],
    note: "",
    contact: { email: "", commercialPhone: "", mobilePhone: "" },
    address: {
      zipCode: "",
      street: "",
      number: "",
      district: "",
      city: "",
      state: "",
      complement: "",
    },
  };
}

export function supplierToFormValues(supplier: Supplier): SupplierFormValues {
  return {
    personType: supplier.personType,
    name: supplier.name,
    legalName: supplier.legalName,
    document: supplier.document,
    stateRegistration: supplier.stateRegistration,
    stateExempt: supplier.stateExempt,
    municipalRegistration: supplier.municipalRegistration,
    sufamaRegistration: supplier.sufamaRegistration,
    foundationDate: supplier.foundationDate,
    unitIds: [...supplier.unitIds],
    note: supplier.note,
    contact: { ...supplier.contact },
    address: { ...supplier.address },
  };
}
