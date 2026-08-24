import type {
  BranchDto,
  CreateBranchPayload,
  UpdateBranchPayload,
} from "@/features/branches/api/branch.dto";
import { maskBranchDocument } from "@/features/branches/lib/branch-format";
import type { Branch, BranchFormValues } from "@/features/branches/types/branch";

function text(value: string | null | undefined): string {
  return value ?? "";
}

export function toBranch(dto: BranchDto): Branch {
  return {
    id: dto.id,
    code: dto.code,
    personType: dto.personType,
    // A API persiste só os dígitos; a máscara é de apresentação (o POST/PUT
    // aceita os dois formatos, então dá para reenviar como está).
    document: maskBranchDocument(dto.document, dto.personType),
    legalName: dto.legalName,
    tradeName: text(dto.tradeName),
    displayName: dto.displayName,
    stateRegistration: text(dto.stateRegistration),
    municipalRegistration: text(dto.municipalRegistration),
    taxRegime: dto.taxRegime,
    isHeadquarters: dto.isHeadquarters,
    address: {
      zipCode: text(dto.address?.zipCode),
      street: text(dto.address?.street),
      number: text(dto.address?.number),
      complement: text(dto.address?.complement),
      neighborhood: text(dto.address?.neighborhood),
      city: text(dto.address?.city),
      state: text(dto.address?.state),
    },
    phone: text(dto.phone),
    email: text(dto.email),
    timezone: dto.timezone,
    active: dto.active,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

/** Campo em branco não vai no corpo — ver `CreateBranchPayload`. */
function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toAddressPayload(values: BranchFormValues) {
  return {
    zipCode: optional(values.address.zipCode),
    street: optional(values.address.street),
    number: optional(values.address.number),
    complement: optional(values.address.complement),
    neighborhood: optional(values.address.neighborhood),
    city: optional(values.address.city),
    state: optional(values.address.state),
  };
}

export function toCreateBranchPayload(
  values: BranchFormValues,
): CreateBranchPayload {
  return {
    code: values.code.trim(),
    personType: values.personType,
    document: values.document.trim(),
    legalName: values.legalName.trim(),
    tradeName: optional(values.tradeName),
    stateRegistration: optional(values.stateRegistration),
    municipalRegistration: optional(values.municipalRegistration),
    taxRegime: values.taxRegime,
    isHeadquarters: values.isHeadquarters,
    ...toAddressPayload(values),
    phone: optional(values.phone),
    email: optional(values.email),
    timezone: optional(values.timezone),
  };
}

export function toUpdateBranchPayload(
  values: BranchFormValues,
): UpdateBranchPayload {
  return {
    legalName: values.legalName.trim(),
    tradeName: optional(values.tradeName),
    stateRegistration: optional(values.stateRegistration),
    municipalRegistration: optional(values.municipalRegistration),
    taxRegime: values.taxRegime,
    isHeadquarters: values.isHeadquarters,
    ...toAddressPayload(values),
    phone: optional(values.phone),
    email: optional(values.email),
    timezone: optional(values.timezone),
    active: values.active,
  };
}
