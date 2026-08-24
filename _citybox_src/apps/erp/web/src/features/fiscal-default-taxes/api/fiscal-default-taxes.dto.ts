export type FiscalTaxType = "ICMS" | "IPI" | "PIS_COFINS" | "ISSQN";

export type FiscalGroupDto = {
  id: string;
  taxType: FiscalTaxType;
  name: string;
};

export type FiscalGroupListResponseDto = {
  data: FiscalGroupDto[];
};

export type FiscalDefaultTaxesDto = {
  id: string;
  icmsGroupId: string | null;
  ipiGroupId: string | null;
  pisCofinsGroupId: string | null;
  issqnGroupId: string | null;
  cfop: string;
  updatedAt: string;
};

export type FiscalDefaultTaxesResponseDto = {
  data: FiscalDefaultTaxesDto;
};

export type UpsertFiscalDefaultTaxesPayload = {
  icmsGroupId: string | null;
  ipiGroupId: string | null;
  pisCofinsGroupId: string | null;
  issqnGroupId: string | null;
  cfop: string;
};
