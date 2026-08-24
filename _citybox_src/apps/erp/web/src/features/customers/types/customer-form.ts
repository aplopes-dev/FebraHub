import type { CustomerStage } from "@/features/customers/types/customer";

export type PersonType = "fisica" | "juridica";

export type AddressType = "principal" | "entrega" | "outro";

export type CustomerAddressForm = {
  id: string;
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
  addressType: AddressType;
};

export type CustomerFormValues = {
  name: string;
  personType: PersonType;
  document: string;
  rg: string;
  birthDate: string;
  email: string;
  mobile: string;
  phone: string;
  additionalPhones: string[];
  categoryId: string;
  selectedUnitIds: string[];
  notes: string;
  addresses: CustomerAddressForm[];
  stage: CustomerStage;
};

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  fisica: "Pessoa física",
  juridica: "Pessoa jurídica",
};

export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  principal: "Principal",
  entrega: "Entrega",
  outro: "Outro",
};

export function documentLabel(personType: PersonType): string {
  return personType === "juridica" ? "CNPJ" : "CPF";
}

export function createEmptyAddress(addressType: AddressType = "principal"): CustomerAddressForm {
  return {
    id: `addr-${crypto.randomUUID().slice(0, 8)}`,
    zipCode: "",
    street: "",
    number: "",
    district: "",
    city: "",
    state: "",
    complement: "",
    addressType,
  };
}

export function createEmptyCustomerFormValues(): CustomerFormValues {
  return {
    name: "",
    personType: "fisica",
    document: "",
    rg: "",
    birthDate: "",
    email: "",
    mobile: "",
    phone: "",
    additionalPhones: [],
    categoryId: "",
    selectedUnitIds: [],
    notes: "",
    addresses: [],
    stage: "lead",
  };
}
