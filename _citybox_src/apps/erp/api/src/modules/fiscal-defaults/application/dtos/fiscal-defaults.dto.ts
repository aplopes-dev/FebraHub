import type {
  FiscalTaxType,
  IpiCst,
  IssqnTribType,
  UfRateType,
} from '../../domain/entities/fiscal-group.entity';

export type ListFiscalGroupsDto = {
  organizationId: string;
  taxType?: FiscalTaxType;
};

/** (spec erp/022, D3) — exclusão bloqueada se em uso (produtos ou padrão fiscal). */
export type DeleteFiscalGroupDto = {
  organizationId: string;
  id: string;
  taxType: FiscalTaxType;
};

export type GetFiscalDefaultTaxesDto = { organizationId: string };

export type UpsertFiscalDefaultTaxesDto = {
  organizationId: string;
  icmsGroupId: string | null;
  ipiGroupId: string | null;
  pisCofinsGroupId: string | null;
  issqnGroupId: string | null;
  cfop: string;
};

// --- Grupo de PIS/COFINS (spec erp/015) ---

export type PisCofinsGroupInput = {
  organizationId: string;
  name: string;
  pisCst: string | null;
  pisAliquota: number | null;
  cofinsCst: string | null;
  cofinsAliquota: number | null;
};

export type CreatePisCofinsGroupDto = PisCofinsGroupInput;
export type UpdatePisCofinsGroupDto = PisCofinsGroupInput & { id: string };
export type GetFiscalGroupDto = {
  organizationId: string;
  id: string;
  /** Se informado, 404 quando o grupo existir mas for de outro tributo. */
  taxType?: FiscalTaxType;
};
export type ListProductsUsingGroupDto = {
  organizationId: string;
  groupId: string;
};

export type ResolveItemPisCofinsDto = {
  organizationId: string;
  /** `pisCofinsGroupId` do produto (ProductFiscal), ou null se o produto não tem grupo. */
  productPisCofinsGroupId: string | null;
};

/** `null` = fallback (produto sem grupo e sem padrão) → emissor usa CST 01 zerado. */
export type ResolvedItemPisCofins = {
  pis: { cst: string; aliquota: number | null };
  cofins: { cst: string; aliquota: number | null };
} | null;

// --- Grupo de ICMS (spec erp/016) ---

export type IcmsUfRateDto = {
  uf: string;
  rateType: UfRateType;
  aliquota: number;
};

export type IcmsGroupInputDto = {
  organizationId: string;
  name: string;
  icmsCst: string | null;
  icmsCsosn: string | null;
  ufRates: IcmsUfRateDto[];
};

export type CreateIcmsGroupDto = IcmsGroupInputDto;
export type UpdateIcmsGroupDto = IcmsGroupInputDto & { id: string };

export type ResolveItemIcmsDto = {
  organizationId: string;
  /** `icmsGroupId` do produto (ProductFiscal), ou null se o produto não tem grupo. */
  productIcmsGroupId: string | null;
  /** UF de destino da operação e UF do Emitente (define INTERNA vs INTERESTADUAL). */
  destinationUf: string;
  emitterUf: string;
};

/** `null` = produto sem grupo e sem padrão → emissor usa ICMS00 zerado (não-regressão). */
export type ResolvedItemIcms = {
  cst: string | null;
  csosn: string | null;
  /** Alíquota da UF de destino (interna se destino = UF emitente; senão interestadual). */
  aliquota: number;
} | null;

// --- Grupo de ISSQN (spec erp/018) ---

export type IssqnGroupInputDto = {
  organizationId: string;
  name: string;
  issqnServiceCode: string;
  issqnNationalCode: string;
  issqnRate: number | null;
  issqnTribType: string;
};

export type CreateIssqnGroupDto = IssqnGroupInputDto;
export type UpdateIssqnGroupDto = IssqnGroupInputDto & { id: string };

export type ResolveServiceIssqnDto = {
  organizationId: string;
  /** `issqnGroupId` do item de serviço (ProductFiscal), ou null se não tem grupo. */
  issqnGroupId: string | null;
};

/** `null` = item sem grupo → a tela de emissão exige escolha explícita do grupo. */
export type ResolvedServiceIssqn = {
  municipalServiceCode: string;
  nationalServiceCode: string;
  issRate: number | null;
  /** Exigibilidade — união literal (a entidade garante ∈ {1,2,4}); evita cast no emissor. */
  tribISSQN: IssqnTribType;
} | null;

// --- Grupo de IPI (spec erp/019) ---

export type IpiGroupInputDto = {
  organizationId: string;
  name: string;
  ipiCst: string;
  ipiEnquadramento: string;
  ipiRate: number | null;
};

export type CreateIpiGroupDto = IpiGroupInputDto;
export type UpdateIpiGroupDto = IpiGroupInputDto & { id: string };

export type ResolveItemIpiDto = {
  organizationId: string;
  /** `ipiGroupId` do produto (ProductFiscal), ou null se o produto não tem grupo de IPI. */
  productIpiGroupId: string | null;
};

/**
 * `null` = item **sem** grupo de IPI → emissor NÃO envia bloco `IPI` no XML
 * (não-regressão FR-008). Só há valor quando o produto tem grupo de IPI.
 */
export type ResolvedItemIpi = {
  /** CST de saída — a entidade garante ∈ IPI_CST_SUPPORTED; evita cast no emissor. */
  cst: IpiCst;
  cEnq: string;
  /** Percentual (%). Presente só para CST tributado (50, 99); null para 51–55. */
  aliquota: number | null;
} | null;
