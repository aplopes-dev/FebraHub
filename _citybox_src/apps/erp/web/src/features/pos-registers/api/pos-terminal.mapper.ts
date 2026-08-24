import {
  resolvePosOptionLabel,
  POS_PRINTER_OPTIONS,
  POS_SCALE_OPTIONS,
} from "@/features/pos-registers/data/pos-register-options";
import type {
  NfceContingency,
  PosRegister,
  PosRegisterFormValues,
} from "@/features/pos-registers/types/pos-register";
import type {
  CreatePosTerminalPayload,
  PosTerminalDto,
  UpdatePosTerminalPayload,
} from "@/features/pos-registers/api/pos-terminal.dto";

function toNfceContingency(value: boolean): NfceContingency {
  return value ? "enabled" : "disabled";
}

function toNfceContingencyDto(value: NfceContingency): boolean {
  return value === "enabled";
}

export function toPosRegister(dto: PosTerminalDto): PosRegister {
  return {
    id: dto.id,
    name: dto.name,
    // A API guarda o rótulo livre (o mesmo texto que o mock salvava); a tela
    // continua exibindo o rótulo, não o id da opção mock.
    printer: dto.printer,
    scale: dto.scale,
    status: dto.status,
    nfceContingency: toNfceContingency(dto.nfceContingency),
    offlineServerId: dto.offlineServerId,
    paired: dto.paired,
    pairedAt: dto.pairedAt,
    pairedDeviceLabel: dto.pairedDeviceLabel,
    lastSeenAt: dto.lastSeenAt,
    moduleOverrides: dto.moduleOverrides,
    deletedAt: dto.deletedAt,
  };
}

export function toCreatePosTerminalPayload(
  values: PosRegisterFormValues,
  branchId: string,
): CreatePosTerminalPayload {
  return {
    branchId,
    name: values.name.trim(),
    status: values.status,
    printer: resolvePosOptionLabel(POS_PRINTER_OPTIONS, values.printerId) ?? undefined,
    scale: resolvePosOptionLabel(POS_SCALE_OPTIONS, values.scaleId) ?? undefined,
    nfceContingency: toNfceContingencyDto(values.nfceContingency),
    offlineServerId: values.offlineServerId || undefined,
  };
}

/** PATCH: o form sempre envia o objeto inteiro — equivale a "tudo mudou". */
export function toUpdatePosTerminalPayload(
  values: PosRegisterFormValues,
): UpdatePosTerminalPayload {
  return {
    name: values.name.trim(),
    status: values.status,
    printer: resolvePosOptionLabel(POS_PRINTER_OPTIONS, values.printerId),
    scale: resolvePosOptionLabel(POS_SCALE_OPTIONS, values.scaleId),
    nfceContingency: toNfceContingencyDto(values.nfceContingency),
    offlineServerId: values.offlineServerId || null,
  };
}
