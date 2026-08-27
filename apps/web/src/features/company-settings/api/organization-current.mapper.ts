import { formatCpf, formatPhone } from "@/lib/br-format";
import type {
  OrganizationCurrentDto,
  UpdateOrganizationCurrentPayload,
} from "@/features/company-settings/api/organization-current.dto";

/** Contato do responsável legal — usado só pelo contrato legado de organization. */
export type OrganizationOwnerContact = {
  name: string;
  document: string;
  email: string;
  phone: string;
};

function text(value: string | null | undefined): string {
  return value ?? "";
}

export function toOwnerContact(
  dto: OrganizationCurrentDto,
): OrganizationOwnerContact {
  return {
    name: dto.responsible.name,
    document: text(dto.responsible.document)
      ? formatCpf(text(dto.responsible.document))
      : "",
    email: text(dto.responsible.email),
    phone: formatPhone(text(dto.responsible.phone)),
  };
}

/** Campo em branco não vai no corpo — ver UpdateOrganizationHttpDto. */
function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** Payload de PUT a partir dos campos soltos do responsável + identificação. */
export function toUpdateOrganizationPayload(input: {
  legalName: string;
  tradeName?: string;
  email: string;
  phone?: string;
  ownerContact: OrganizationOwnerContact;
}): UpdateOrganizationCurrentPayload {
  return {
    legalName: input.legalName.trim(),
    tradeName: optional(input.tradeName ?? ""),
    email: input.email.trim(),
    phone: optional(input.phone ?? ""),
    responsibleName: input.ownerContact.name.trim(),
    responsibleDocument: optional(input.ownerContact.document),
    responsibleEmail: optional(input.ownerContact.email),
    responsiblePhone: optional(input.ownerContact.phone),
  };
}
