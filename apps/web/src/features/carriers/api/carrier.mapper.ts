import type {
  CarrierDto,
  CarrierPersonTypeDto,
  SaveCarrierPayload,
} from "@/features/carriers/api/carrier.dto";
import {
  formatDocument,
  type Carrier,
  type CarrierFormValues,
  type PersonType,
} from "@/features/carriers/types/carrier";

function toPersonType(personType: CarrierPersonTypeDto): PersonType {
  return personType === "PF" ? "fisica" : "juridica";
}

function toPersonTypeDto(personType: PersonType): CarrierPersonTypeDto {
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

export function toCarrier(dto: CarrierDto): Carrier {
  return {
    id: dto.id,
    personType: toPersonType(dto.personType),
    deliveryType: dto.deliveryType,
    tradeName: dto.name,
    legalName: text(dto.legalName),
    // A API guarda só dígitos; a tela (lista e formulário) mostra pontuado.
    document: formatDocument(dto.document),
    fiscal: {
      icmsExempt: dto.icmsExempt,
      registerInNfe: dto.registerInNfe,
      noStateRegistration: dto.stateExempt,
      stateRegistration: text(dto.stateRegistration),
      municipalRegistration: text(dto.municipalRegistration),
    },
    unitIds: [...dto.branchIds],
    contact: {
      email: text(dto.contact.email),
      commercialPhone: text(dto.contact.commercialPhone),
      mobilePhone: text(dto.contact.mobilePhone),
      // Sem correspondente na API — permanece só no form, nunca é enviado.
      additionalPhone: "",
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

export function toSaveCarrierPayload(
  values: CarrierFormValues,
): SaveCarrierPayload {
  return {
    personType: toPersonTypeDto(values.personType),
    deliveryType: values.deliveryType,
    name: values.tradeName.trim(),
    legalName: optionalText(values.legalName),
    document: values.document.trim(),
    icmsExempt: values.fiscal.icmsExempt,
    registerInNfe: values.fiscal.registerInNfe,
    // Isento não guarda inscrição: mandá-la junto faria o cadastro afirmar
    // duas coisas contrárias (a API descarta, mas a intenção fica explícita
    // aqui).
    stateExempt: values.fiscal.noStateRegistration,
    stateRegistration: values.fiscal.noStateRegistration
      ? undefined
      : optionalText(values.fiscal.stateRegistration),
    municipalRegistration: optionalText(values.fiscal.municipalRegistration),
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
