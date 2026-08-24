import type {
  CustomerAddressDto,
  CustomerDetailDto,
  CustomerListItemDto,
  CustomerPersonTypeDto,
  SaveCustomerPayload,
} from "@/features/customers/api/customer.dto";
import type { Customer } from "@/features/customers/types/customer";
import {
  type CustomerAddressForm,
  type CustomerFormValues,
  type PersonType,
} from "@/features/customers/types/customer-form";

function toPersonType(personType: CustomerPersonTypeDto): PersonType {
  return personType === "PF" ? "fisica" : "juridica";
}

function toPersonTypeDto(personType: PersonType): CustomerPersonTypeDto {
  return personType === "fisica" ? "PF" : "PJ";
}

function text(value: string | null | undefined): string {
  return value ?? "";
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatDocumentDigits(document: string | null): string {
  if (!document) return "";
  const digits = document.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (digits.length === 14) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  }
  return digits;
}

export function toCustomerListItem(dto: CustomerListItemDto): Customer {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    salesTotal: dto.salesTotal,
    createdAt: dto.createdAt,
    stage: dto.stage,
    categoryId: dto.categoryId,
  };
}

function toAddressForm(dto: CustomerAddressDto): CustomerAddressForm {
  return {
    id: dto.id,
    addressType: dto.addressType,
    zipCode: text(dto.zipCode),
    street: text(dto.street),
    number: text(dto.number),
    district: text(dto.district),
    city: text(dto.city),
    state: text(dto.state),
    complement: text(dto.complement),
  };
}

export function toCustomerFormValues(
  dto: CustomerDetailDto,
): CustomerFormValues {
  return {
    name: dto.name,
    personType: toPersonType(dto.personType),
    document: formatDocumentDigits(dto.document),
    rg: text(dto.rg),
    birthDate: text(dto.birthDate),
    email: text(dto.email),
    mobile: text(dto.mobilePhone),
    phone: text(dto.phone),
    additionalPhones: [...dto.additionalPhones],
    categoryId: text(dto.categoryId),
    selectedUnitIds: [...dto.branchIds],
    notes: dto.notes ?? "",
    addresses: dto.addresses.map(toAddressForm),
    stage: dto.stage,
  };
}

/** Lista / selects: detalhe mapeado para o shape enxuto da listagem. */
export function toCustomerFromDetail(dto: CustomerDetailDto): Customer {
  return {
    id: dto.id,
    name: dto.name,
    email: text(dto.email),
    phone: text(dto.mobilePhone) || text(dto.phone),
    salesTotal: 0,
    createdAt: dto.createdAt,
    stage: dto.stage,
    categoryId: dto.categoryId,
  };
}

export function toSaveCustomerPayload(
  values: CustomerFormValues,
): SaveCustomerPayload {
  const document = values.document.replace(/\D/g, "");

  return {
    personType: toPersonTypeDto(values.personType),
    name: values.name.trim(),
    document: document || undefined,
    rg: optionalText(values.rg),
    birthDate: optionalText(values.birthDate),
    email: optionalText(values.email),
    mobilePhone: optionalText(values.mobile),
    phone: optionalText(values.phone),
    additionalPhones: values.additionalPhones
      .map((phone) => phone.trim())
      .filter(Boolean),
    stage: values.stage,
    categoryId: optionalText(values.categoryId),
    notes: optionalText(values.notes),
    addresses: values.addresses.map((address) => ({
      id: address.id.startsWith("addr-") ? undefined : address.id,
      addressType: address.addressType,
      zipCode: optionalText(address.zipCode),
      street: optionalText(address.street),
      number: optionalText(address.number),
      district: optionalText(address.district),
      city: optionalText(address.city),
      state: optionalText(address.state),
      complement: optionalText(address.complement),
    })),
    branchIds: [...values.selectedUnitIds],
  };
}
