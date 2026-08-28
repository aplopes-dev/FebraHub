import {
  DEFAULT_TIMEZONE,
  EMPTY_UNIT_ADDRESS,
  type UnitAddress,
} from "./address";

/** Formulário de Dados da empresa = cadastro do Grupo (holding / marca). */
export type GroupSettingsValues = {
  legalName: string;
  tradeName: string;
  holdingDocument: string;
  email: string;
  phone: string;
  adminAddress: UnitAddress;
  timezone: string;
};

/** @deprecated use GroupSettingsValues — mantido para reexports legados. */
export type CompanySettingsValues = GroupSettingsValues;

export function createEmptyGroupSettingsValues(): GroupSettingsValues {
  return {
    legalName: "",
    tradeName: "",
    holdingDocument: "",
    email: "",
    phone: "",
    adminAddress: { ...EMPTY_UNIT_ADDRESS },
    timezone: DEFAULT_TIMEZONE,
  };
}

/** @deprecated use createEmptyGroupSettingsValues */
export function createEmptyCompanySettingsValues(): GroupSettingsValues {
  return createEmptyGroupSettingsValues();
}
