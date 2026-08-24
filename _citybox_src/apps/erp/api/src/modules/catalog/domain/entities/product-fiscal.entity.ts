import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export type FiscalGroupField = {
  value: string;
  applyToAll: boolean;
};

export type FiscalBranchOverride = {
  branchId: string;
  icms: string;
  pisCofins: string;
  ipi: string;
  cfop: string;
  issqn: string;
};

export type ProductFiscalInfo = {
  ncm: string;
  origin: string;
  netWeightKg: number;
  grossWeightKg: number;
  cest: string;
  fcpPercent: number;
  fcpStPercent: number;
  fcpStRetainedPercent: number;
  cstIbsCbs: string;
  taxClassification: string;
};

export type ProductFiscalProps = ProductFiscalInfo & {
  organizationId: string;
  productId: string;
  icms: FiscalGroupField;
  pisCofins: FiscalGroupField;
  ipi: FiscalGroupField;
  cfop: FiscalGroupField;
  issqn: FiscalGroupField;
  /** FK opcional para o grupo de PIS/COFINS (spec erp/015). A emissão resolve por ela. */
  pisCofinsGroupId: string | null;
  /** FK opcional para o grupo de ICMS (spec erp/016). A emissão resolve situação + alíquota por UF. */
  icmsGroupId: string | null;
  /** FK opcional para o grupo de ISSQN (spec erp/018). A emissão de NFS-e resolve código/alíquota/exigibilidade. */
  issqnGroupId: string | null;
  /** FK opcional para o grupo de IPI (spec erp/019). A emissão resolve CST + cEnq + percentual. */
  ipiGroupId: string | null;
  branches: FiscalBranchOverride[];
  createdAt: Date;
  updatedAt: Date;
};

type CreateProductFiscalProps = Optional<
  ProductFiscalProps,
  | 'createdAt'
  | 'updatedAt'
  | 'branches'
  | 'issqn'
  | 'pisCofinsGroupId'
  | 'icmsGroupId'
  | 'issqnGroupId'
  | 'ipiGroupId'
>;

function normalizeString(value: string | undefined | null): string {
  return (value ?? '').trim();
}

function normalizeNonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function normalizeGroupField(
  field: FiscalGroupField | undefined,
): FiscalGroupField {
  return {
    value: normalizeString(field?.value),
    applyToAll: field?.applyToAll ?? true,
  };
}

function normalizeBranches(
  branches: FiscalBranchOverride[] | undefined,
  group: {
    icms: FiscalGroupField;
    pisCofins: FiscalGroupField;
    ipi: FiscalGroupField;
    cfop: FiscalGroupField;
    issqn: FiscalGroupField;
  },
): FiscalBranchOverride[] {
  const byBranch = new Map<string, FiscalBranchOverride>();
  for (const branch of branches ?? []) {
    if (!branch.branchId) continue;
    byBranch.set(branch.branchId, {
      branchId: branch.branchId,
      icms: group.icms.applyToAll ? '' : normalizeString(branch.icms),
      pisCofins: group.pisCofins.applyToAll
        ? ''
        : normalizeString(branch.pisCofins),
      ipi: group.ipi.applyToAll ? '' : normalizeString(branch.ipi),
      cfop: group.cfop.applyToAll ? '' : normalizeString(branch.cfop),
      issqn: group.issqn.applyToAll ? '' : normalizeString(branch.issqn),
    });
  }

  return [...byBranch.values()].filter(
    (row) =>
      row.icms !== '' ||
      row.pisCofins !== '' ||
      row.ipi !== '' ||
      row.cfop !== '' ||
      row.issqn !== '',
  );
}

export class ProductFiscal extends Entity<ProductFiscalProps> {
  constructor(props: ProductFiscalProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Pesos/FCP já normalizados; unicidade e FK nos use cases.
  }

  public static create(
    props: CreateProductFiscalProps,
    id?: string,
  ): ProductFiscal {
    const icms = normalizeGroupField(props.icms);
    const pisCofins = normalizeGroupField(props.pisCofins);
    const ipi = normalizeGroupField(props.ipi);
    const cfop = normalizeGroupField(props.cfop);
    const issqn = normalizeGroupField(props.issqn);

    return new ProductFiscal(
      {
        organizationId: props.organizationId,
        productId: props.productId,
        ncm: normalizeString(props.ncm),
        origin: normalizeString(props.origin),
        netWeightKg: normalizeNonNegative(props.netWeightKg),
        grossWeightKg: normalizeNonNegative(props.grossWeightKg),
        cest: normalizeString(props.cest),
        fcpPercent: normalizeNonNegative(props.fcpPercent),
        fcpStPercent: normalizeNonNegative(props.fcpStPercent),
        fcpStRetainedPercent: normalizeNonNegative(props.fcpStRetainedPercent),
        cstIbsCbs: normalizeString(props.cstIbsCbs),
        taxClassification: normalizeString(props.taxClassification),
        icms,
        pisCofins,
        ipi,
        cfop,
        issqn,
        pisCofinsGroupId: props.pisCofinsGroupId ?? null,
        icmsGroupId: props.icmsGroupId ?? null,
        issqnGroupId: props.issqnGroupId ?? null,
        ipiGroupId: props.ipiGroupId ?? null,
        branches: normalizeBranches(props.branches, {
          icms,
          pisCofins,
          ipi,
          cfop,
          issqn,
        }),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: ProductFiscalProps, id: string): ProductFiscal {
    return new ProductFiscal(props, id);
  }

  /** Configurado = existe ficha com NCM e origem preenchidos. */
  public static isConfigured(fiscal: ProductFiscal | null): boolean {
    if (!fiscal) return false;
    return fiscal.ncm !== '' && fiscal.origin !== '';
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get productId() {
    return this.props.productId;
  }
  get ncm() {
    return this.props.ncm;
  }
  get origin() {
    return this.props.origin;
  }
  get netWeightKg() {
    return this.props.netWeightKg;
  }
  get grossWeightKg() {
    return this.props.grossWeightKg;
  }
  get cest() {
    return this.props.cest;
  }
  get fcpPercent() {
    return this.props.fcpPercent;
  }
  get fcpStPercent() {
    return this.props.fcpStPercent;
  }
  get fcpStRetainedPercent() {
    return this.props.fcpStRetainedPercent;
  }
  get cstIbsCbs() {
    return this.props.cstIbsCbs;
  }
  get taxClassification() {
    return this.props.taxClassification;
  }
  get icms() {
    return this.props.icms;
  }
  get pisCofins() {
    return this.props.pisCofins;
  }
  get ipi() {
    return this.props.ipi;
  }
  get cfop() {
    return this.props.cfop;
  }
  get issqn() {
    return this.props.issqn;
  }
  get pisCofinsGroupId() {
    return this.props.pisCofinsGroupId;
  }
  get icmsGroupId() {
    return this.props.icmsGroupId;
  }
  get issqnGroupId() {
    return this.props.issqnGroupId;
  }
  get ipiGroupId() {
    return this.props.ipiGroupId;
  }
  get branches() {
    return this.props.branches;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  get configured(): boolean {
    return ProductFiscal.isConfigured(this);
  }
}
