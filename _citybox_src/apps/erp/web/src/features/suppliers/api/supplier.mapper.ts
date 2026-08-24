import type {
  SaveSupplierPayload,
  SupplierDto,
  SupplierPersonTypeDto,
} from "@/features/suppliers/api/supplier.dto";
import {
  formatDocument,
  type PersonType,
  type Supplier,
  type SupplierFormValues,
} from "@/features/suppliers/types/supplier";

function toPersonType(personType: SupplierPersonTypeDto): PersonType {
  return personType === "PF" ? "fisica" : "juridica";
}

function toPersonTypeDto(personType: PersonType): SupplierPersonTypeDto {
  return personType === "fisica" ? "PF" : "PJ";
}

/** A UI trabalha com campo vazio, não com ausência de valor. */
function text(value: string | null): string {
  return value ?? "";
}

/** O inverso: campo em branco vira omissão, que a API entende como "limpar". */
function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function toSupplier(dto: SupplierDto): Supplier {
  return {
    id: dto.id,
    personType: toPersonType(dto.personType),
    name: dto.name,
    legalName: text(dto.legalName),
    // A API guarda só dígitos; a tela (lista e formulário) mostra pontuado.
    // Na volta o documento é normalizado lá, então a máscara não atrapalha.
    document: formatDocument(dto.document),
    stateRegistration: text(dto.stateRegistration),
    stateExempt: dto.stateExempt,
    municipalRegistration: text(dto.municipalRegistration),
    sufamaRegistration: text(dto.sufamaRegistration),
    foundationDate: text(dto.foundationDate),
    unitIds: [...dto.branchIds],
    note: dto.note ?? "",
    contact: {
      email: text(dto.contact.email),
      commercialPhone: text(dto.contact.commercialPhone),
      mobilePhone: text(dto.contact.mobilePhone),
    },
    address: {
      zipCode: text(dto.address.zipCode),
      street: text(dto.address.street),
      number: text(dto.address.number),
      district: text(dto.address.district),
      city: text(dto.address.city),
      state: text(dto.address.state),
      complement: text(dto.address.complement),
    },
    deletedAt: dto.deletedAt,
  };
}

export function toSaveSupplierPayload(
  values: SupplierFormValues,
): SaveSupplierPayload {
  return {
    personType: toPersonTypeDto(values.personType),
    name: values.name.trim(),
    legalName: optionalText(values.legalName),
    document: values.document.replace(/\D/g, ""),
    // Isento não guarda inscrição: mandá-la junto faria o cadastro afirmar duas
    // coisas contrárias (a API descarta, mas a intenção fica explícita aqui).
    stateRegistration: values.stateExempt
      ? undefined
      : optionalText(values.stateRegistration),
    stateExempt: values.stateExempt,
    municipalRegistration: optionalText(values.municipalRegistration),
    sufamaRegistration: optionalText(values.sufamaRegistration),
    foundationDate: optionalText(values.foundationDate),
    note: optionalText(values.note),
    email: optionalText(values.contact.email),
    commercialPhone: optionalText(values.contact.commercialPhone),
    mobilePhone: optionalText(values.contact.mobilePhone),
    zipCode: optionalText(values.address.zipCode),
    street: optionalText(values.address.street),
    number: optionalText(values.address.number),
    complement: optionalText(values.address.complement),
    district: optionalText(values.address.district),
    city: optionalText(values.address.city),
    state: optionalText(values.address.state),
    branchIds: [...values.unitIds],
  };
}
