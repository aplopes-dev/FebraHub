import { productImageProxyUrl } from "@/features/products/api/product-image-url";
import type {
  FiscalInfoValues,
  FiscalParameterListItem,
  FiscalParametersFormValues,
} from "@/features/fiscal-parameters/types/fiscal-parameters";
import type {
  FiscalInfoDto,
  FiscalParameterDetailDto,
  FiscalParameterListItemDto,
  UpsertFiscalParametersPayload,
} from "./fiscal-parameters.dto";

function decimalToFormString(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return String(value);
}

function formStringToDecimal(value: string): number {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function toFiscalParameterListItem(
  dto: FiscalParameterListItemDto,
): FiscalParameterListItem {
  return {
    id: dto.id,
    name: dto.name,
    sku: dto.sku,
    imageUrl: dto.hasImage ? productImageProxyUrl(dto.id) : undefined,
    category: dto.category,
    configured: dto.configured,
  };
}

export function toFiscalParametersFormValues(
  dto: FiscalParameterDetailDto,
): FiscalParametersFormValues {
  return {
    info: {
      ncm: dto.info.ncm,
      origin: dto.info.origin,
      netWeight: decimalToFormString(dto.info.netWeightKg),
      grossWeight: decimalToFormString(dto.info.grossWeightKg),
      cest: dto.info.cest,
      fcp: decimalToFormString(dto.info.fcpPercent),
      fcpSt: decimalToFormString(dto.info.fcpStPercent),
      fcpStRetained: decimalToFormString(dto.info.fcpStRetainedPercent),
      cstIbsCbs: dto.info.cstIbsCbs,
      taxClassification: dto.info.taxClassification,
    },
    group: {
      icms: { ...dto.group.icms },
      pisCofins: { ...dto.group.pisCofins },
      ipi: { ...dto.group.ipi },
      cfop: { ...dto.group.cfop },
      issqn: dto.group.issqn
        ? { ...dto.group.issqn }
        : { value: "", applyToAll: true },
    },
    units: dto.units.map((unit) => ({
      branchId: unit.branchId,
      icms: unit.icms,
      pisCofins: unit.pisCofins,
      ipi: unit.ipi,
      cfop: unit.cfop,
      issqn: unit.issqn ?? "",
    })),
  };
}

function infoToDto(info: FiscalInfoValues): FiscalInfoDto {
  return {
    ncm: info.ncm,
    origin: info.origin,
    netWeightKg: formStringToDecimal(info.netWeight),
    grossWeightKg: formStringToDecimal(info.grossWeight),
    cest: info.cest,
    fcpPercent: formStringToDecimal(info.fcp),
    fcpStPercent: formStringToDecimal(info.fcpSt),
    fcpStRetainedPercent: formStringToDecimal(info.fcpStRetained),
    cstIbsCbs: info.cstIbsCbs,
    taxClassification: info.taxClassification,
  };
}

export function toUpsertFiscalParametersPayload(
  values: FiscalParametersFormValues,
): UpsertFiscalParametersPayload {
  return {
    info: infoToDto(values.info),
    group: {
      icms: { ...values.group.icms },
      pisCofins: { ...values.group.pisCofins },
      ipi: { ...values.group.ipi },
      cfop: { ...values.group.cfop },
      issqn: { ...values.group.issqn },
    },
    units: values.units.map((unit) => ({
      branchId: unit.branchId,
      icms: unit.icms,
      pisCofins: unit.pisCofins,
      ipi: unit.ipi,
      cfop: unit.cfop,
      issqn: unit.issqn,
    })),
  };
}
