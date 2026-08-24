import type {
  FiscalGroupField,
  FiscalGroupValues,
  FiscalInfoValues,
  FiscalParametersFormValues,
  FiscalUnitConfig,
} from "@/features/fiscal-parameters/types/fiscal-parameters";

function createEmptyGroupField(): FiscalGroupField {
  return { value: "", applyToAll: true };
}

function createEmptyInfo(): FiscalInfoValues {
  return {
    ncm: "",
    origin: "",
    netWeight: "",
    grossWeight: "",
    cest: "",
    fcp: "",
    fcpSt: "",
    fcpStRetained: "",
    cstIbsCbs: "",
    taxClassification: "",
  };
}

function createEmptyGroup(): FiscalGroupValues {
  return {
    icms: createEmptyGroupField(),
    pisCofins: createEmptyGroupField(),
    ipi: createEmptyGroupField(),
    cfop: createEmptyGroupField(),
    issqn: createEmptyGroupField(),
  };
}

export function createEmptyFiscalParametersFormValues(
  units: FiscalUnitConfig[] = [],
): FiscalParametersFormValues {
  return {
    info: createEmptyInfo(),
    group: createEmptyGroup(),
    units,
  };
}

function areInfoEqual(a: FiscalInfoValues, b: FiscalInfoValues): boolean {
  return (
    a.ncm === b.ncm &&
    a.origin === b.origin &&
    a.netWeight === b.netWeight &&
    a.grossWeight === b.grossWeight &&
    a.cest === b.cest &&
    a.fcp === b.fcp &&
    a.fcpSt === b.fcpSt &&
    a.fcpStRetained === b.fcpStRetained &&
    a.cstIbsCbs === b.cstIbsCbs &&
    a.taxClassification === b.taxClassification
  );
}

function areGroupFieldsEqual(a: FiscalGroupField, b: FiscalGroupField): boolean {
  return a.value === b.value && a.applyToAll === b.applyToAll;
}

function areGroupEqual(a: FiscalGroupValues, b: FiscalGroupValues): boolean {
  return (
    areGroupFieldsEqual(a.icms, b.icms) &&
    areGroupFieldsEqual(a.pisCofins, b.pisCofins) &&
    areGroupFieldsEqual(a.ipi, b.ipi) &&
    areGroupFieldsEqual(a.cfop, b.cfop) &&
    areGroupFieldsEqual(a.issqn, b.issqn)
  );
}

function areUnitsEqual(
  a: FiscalUnitConfig[],
  b: FiscalUnitConfig[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((unit, index) => {
    const other = b[index];
    return (
      other != null &&
      unit.branchId === other.branchId &&
      unit.icms === other.icms &&
      unit.pisCofins === other.pisCofins &&
      unit.ipi === other.ipi &&
      unit.cfop === other.cfop &&
      unit.issqn === other.issqn
    );
  });
}

export function areFiscalParametersFormValuesEqual(
  a: FiscalParametersFormValues,
  b: FiscalParametersFormValues,
): boolean {
  return (
    areInfoEqual(a.info, b.info) &&
    areGroupEqual(a.group, b.group) &&
    areUnitsEqual(a.units, b.units)
  );
}
