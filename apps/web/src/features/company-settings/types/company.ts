import {
  DEFAULT_BRANCH_TIMEZONE,
  EMPTY_BRANCH_ADDRESS,
  type BranchAddress,
} from "@/features/branches/types/branch";

/** Formulário de Dados da empresa = cadastro do Grupo (holding / marca). */
export type GroupSettingsValues = {
  legalName: string;
  tradeName: string;
  holdingDocument: string;
  email: string;
  phone: string;
  adminAddress: BranchAddress;
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
    adminAddress: { ...EMPTY_BRANCH_ADDRESS },
    timezone: DEFAULT_BRANCH_TIMEZONE,
  };
}

/** @deprecated use createEmptyGroupSettingsValues */
export function createEmptyCompanySettingsValues(): GroupSettingsValues {
  return createEmptyGroupSettingsValues();
}
