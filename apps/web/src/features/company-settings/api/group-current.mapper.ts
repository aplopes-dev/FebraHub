import { formatCnpj, formatPhone } from "@/lib/br-format";
import type {
  GroupCurrentDto,
  UpdateGroupCurrentPayload,
} from "@/features/company-settings/api/group-current.dto";
import type { GroupSettingsValues } from "@/features/company-settings/types/company";
import { EMPTY_BRANCH_ADDRESS } from "@/features/branches/types/branch";

function text(value: string | null | undefined): string {
  return value ?? "";
}

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function toGroupSettingsValues(dto: GroupCurrentDto): GroupSettingsValues {
  return {
    legalName: dto.legalName,
    tradeName: text(dto.tradeName),
    holdingDocument: text(dto.holdingDocument)
      ? formatCnpj(text(dto.holdingDocument))
      : "",
    email: dto.email,
    phone: formatPhone(text(dto.phone)),
    adminAddress: {
      ...EMPTY_BRANCH_ADDRESS,
      ...dto.adminAddress,
    },
    timezone: dto.timezone,
  };
}

export function toUpdateGroupPayload(
  values: GroupSettingsValues,
): UpdateGroupCurrentPayload {
  return {
    legalName: values.legalName.trim(),
    tradeName: optional(values.tradeName),
    holdingDocument: optional(values.holdingDocument),
    email: values.email.trim(),
    phone: optional(values.phone),
    adminAddress: values.adminAddress,
    timezone: values.timezone,
  };
}
