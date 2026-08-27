import type { CustomerAddressForm } from "@/features/customers/types/customer-form";

export type CustomerQuickCreateValues = {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  address: Omit<CustomerAddressForm, "id" | "addressType">;
};

export function createEmptyQuickCreateValues(): CustomerQuickCreateValues {
  return {
    name: "",
    cpf: "",
    phone: "",
    email: "",
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

export function hasAnyAddressField(
  address: CustomerQuickCreateValues["address"],
): boolean {
  return Object.values(address).some((value) => value.trim().length > 0);
}
