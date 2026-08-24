import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { isValidIpiEnquadramento } from '../ipi-enquadramento.table';

export const FISCAL_TAX_TYPES = ['ICMS', 'IPI', 'PIS_COFINS', 'ISSQN'] as const;
/** Tributo ao qual o grupo pertence. Um grupo é sempre de um único tributo. */
export type FiscalTaxType = (typeof FISCAL_TAX_TYPES)[number];

/** CST de PIS/COFINS tributado por alíquota (`PISAliq`/`COFINSAliq`) — exige alíquota. */
export const PIS_COFINS_CST_TRIBUTADO = ['01', '02'] as const;
/** CST de PIS/COFINS não tributado (`PISNT`/`COFINSNT`) — sem alíquota/valor. */
export const PIS_COFINS_CST_NAO_TRIBUTADO = [
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
] as const;
/** Conjunto suportado nesta entrega (spec erp/015). Fora: 03 (Qtde) e 49–99. */
export const PIS_COFINS_CST_SUPPORTED = [
  ...PIS_COFINS_CST_TRIBUTADO,
  ...PIS_COFINS_CST_NAO_TRIBUTADO,
] as const;
export type PisCofinsCst = (typeof PIS_COFINS_CST_SUPPORTED)[number];

const MAX_ALIQUOTA = 100;

export function isPisCofinsCstTributado(cst: string): boolean {
  return (PIS_COFINS_CST_TRIBUTADO as readonly string[]).includes(cst);
}

/** Dedup por (uf, rateType) mantendo a última ocorrência; UF em caixa alta. */
function normalizeUfRates(rates: FiscalGroupUfRate[]): FiscalGroupUfRate[] {
  const byKey = new Map<string, FiscalGroupUfRate>();
  for (const rate of rates) {
    const uf = rate.uf.trim().toUpperCase();
    byKey.set(`${uf}:${rate.rateType}`, { ...rate, uf });
  }
  return [...byKey.values()];
}

/**
 * Exigibilidade do ISSQN (`tribISSQN`, spec erp/018) suportada nesta fatia: 1
 * (operação tributável), 2 (imunidade), 4 (não incidência). 3 (exportação) exige
 * dados extras da nota e fica para evolução.
 */
export const ISSQN_TRIB_TYPE_SUPPORTED = ['1', '2', '4'] as const;
export type IssqnTribType = (typeof ISSQN_TRIB_TYPE_SUPPORTED)[number];
/** Código municipal do serviço no formato LC 116 (`NN.NN`). */
const ISSQN_SERVICE_CODE_RE = /^\d{2}\.\d{2}$/;
/** Código de tributação nacional (`cTribNac`): exatamente 6 dígitos. */
const ISSQN_NATIONAL_CODE_RE = /^\d{6}$/;

/**
 * CST de IPI **de saída** suportado (spec erp/019). O v1 só emite saída
 * (`tpNF: '1'`); entradas (00–05, 49) ficam de fora. Tributado (50, 99) → `IPITrib`
 * (com percentual); 51–55 → `IPINT` (sem percentual).
 */
export const IPI_CST_SUPPORTED = [
  '50',
  '51',
  '52',
  '53',
  '54',
  '55',
  '99',
] as const;
/** CST de IPI tributado (`IPITrib`): exige percentual. */
export const IPI_CST_TRIBUTADO = ['50', '99'] as const;
export type IpiCst = (typeof IPI_CST_SUPPORTED)[number];

export function isIpiCstTributado(cst: string): boolean {
  return (IPI_CST_TRIBUTADO as readonly string[]).includes(cst);
}

/** CST de ICMS suportado nesta entrega (spec erp/016): só 00 (tributada integral). */
export const ICMS_CST_SUPPORTED = ['00'] as const;
/** CSOSN suportado (Simples): só os que exigem apenas `orig` + `CSOSN`. */
export const ICMS_CSOSN_SUPPORTED = ['102', '103', '300', '400'] as const;
/** Tipo da alíquota por UF. */
export const UF_RATE_TYPES = ['INTERNA', 'INTERESTADUAL'] as const;
export type UfRateType = (typeof UF_RATE_TYPES)[number];

/** Alíquota de ICMS por UF (tabela filha, spec erp/016). */
export type FiscalGroupUfRate = {
  uf: string;
  rateType: UfRateType;
  aliquota: number;
};

export type FiscalGroupProps = {
  organizationId: string;
  taxType: FiscalTaxType;
  name: string;
  // Regra de PIS/COFINS (usada quando taxType = PIS_COFINS) — spec erp/015.
  pisCst: string | null;
  pisAliquota: number | null;
  cofinsCst: string | null;
  cofinsAliquota: number | null;
  // Situação de ICMS (usada quando taxType = ICMS) — spec erp/016. Exatamente uma.
  icmsCst: string | null;
  icmsCsosn: string | null;
  // Alíquotas por UF (só ICMS). Vazio para os demais tributos.
  ufRates: FiscalGroupUfRate[];
  // Situação de ISSQN (usada quando taxType = ISSQN) — spec erp/018.
  issqnServiceCode: string | null;
  issqnNationalCode: string | null;
  issqnRate: number | null;
  issqnTribType: string | null;
  // Situação de IPI (usada quando taxType = IPI) — spec erp/019.
  ipiCst: string | null;
  ipiEnquadramento: string | null;
  ipiRate: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateFiscalGroupProps = Optional<
  FiscalGroupProps,
  | 'pisCst'
  | 'pisAliquota'
  | 'cofinsCst'
  | 'cofinsAliquota'
  | 'icmsCst'
  | 'icmsCsosn'
  | 'ufRates'
  | 'issqnServiceCode'
  | 'issqnNationalCode'
  | 'issqnRate'
  | 'issqnTribType'
  | 'ipiCst'
  | 'ipiEnquadramento'
  | 'ipiRate'
  | 'createdAt'
  | 'updatedAt'
>;

export type UpdateFiscalGroupInput = {
  name: string;
  pisCst: string | null;
  pisAliquota: number | null;
  cofinsCst: string | null;
  cofinsAliquota: number | null;
};

export type IcmsGroupInput = {
  name: string;
  icmsCst: string | null;
  icmsCsosn: string | null;
  ufRates: FiscalGroupUfRate[];
};

export type IssqnGroupInput = {
  name: string;
  issqnServiceCode: string;
  issqnNationalCode: string;
  issqnRate: number | null;
  issqnTribType: string;
};

export type IpiGroupInput = {
  name: string;
  ipiCst: string;
  ipiEnquadramento: string;
  /** Percentual (%). Só aplicável/obrigatório para CST tributado (50, 99). */
  ipiRate: number | null;
};

/**
 * Grupo fiscal por organização + tributo (spec erp/014, estendido na erp/015).
 *
 * ⚠️ Distinto do tipo `FiscalGroupField` (`{value, applyToAll}`) usado dentro de
 * `ProductFiscal` no módulo catalog — este é a entidade catálogo de grupos.
 * As colunas de PIS/COFINS só valem quando `taxType = PIS_COFINS`; 016 (ICMS) e
 * 019 (IPI) acrescentarão as suas à mesma entidade.
 */
export class FiscalGroup extends Entity<FiscalGroupProps> {
  constructor(props: FiscalGroupProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (!FISCAL_TAX_TYPES.includes(this.props.taxType)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid fiscal taxType: ${String(this.props.taxType)}`,
        externalMessage: 'Tributo do grupo fiscal inválido.',
        context: 'FiscalGroup',
      });
    }
    if (this.props.name.trim().length === 0) {
      throw new ValidatorDomainError({
        internalMessage: 'FiscalGroup name is empty',
        externalMessage: 'O grupo fiscal precisa de um nome.',
        context: 'FiscalGroup',
      });
    }
    if (this.props.taxType === 'PIS_COFINS') {
      this.validatePisCofins();
    }
    if (this.props.taxType === 'ICMS') {
      this.validateIcms();
    }
    if (this.props.taxType === 'ISSQN') {
      this.validateIssqn();
    }
    if (this.props.taxType === 'IPI') {
      this.validateIpi();
    }
  }

  private validateIpi(): void {
    const { ipiCst, ipiEnquadramento, ipiRate } = this.props;
    if (
      ipiCst === null ||
      !(IPI_CST_SUPPORTED as readonly string[]).includes(ipiCst)
    ) {
      throw new ValidatorDomainError({
        internalMessage: `Unsupported IPI CST: ${ipiCst}`,
        externalMessage: `A situação tributária de IPI "${String(ipiCst)}" não é suportada nesta versão.`,
        context: 'FiscalGroup',
      });
    }
    // `cEnq` obrigatório quando há grupo, e restrito à tabela versionada (FR-009).
    if (!isValidIpiEnquadramento(ipiEnquadramento)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid IPI cEnq: ${String(ipiEnquadramento)}`,
        externalMessage:
          'Informe um Grupo de Enquadramento Legal do IPI (cEnq) válido.',
        context: 'FiscalGroup',
      });
    }
    if (isIpiCstTributado(ipiCst)) {
      // Tributado (50, 99): percentual obrigatório e na faixa.
      if (ipiRate === null) {
        throw new ValidatorDomainError({
          internalMessage: `IPI rate required for tributado CST ${ipiCst}`,
          externalMessage:
            'O percentual do IPI é obrigatório para a situação selecionada.',
          context: 'FiscalGroup',
        });
      }
      if (!Number.isFinite(ipiRate) || ipiRate < 0 || ipiRate > MAX_ALIQUOTA) {
        throw new ValidatorDomainError({
          internalMessage: `IPI rate out of range: ${ipiRate}`,
          externalMessage: `O percentual do IPI deve estar entre 0 e ${MAX_ALIQUOTA}.`,
          context: 'FiscalGroup',
        });
      }
    }
  }

  private validateIssqn(): void {
    const { issqnServiceCode, issqnNationalCode, issqnRate, issqnTribType } =
      this.props;
    if (!issqnServiceCode || !ISSQN_SERVICE_CODE_RE.test(issqnServiceCode)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid ISSQN service code: ${issqnServiceCode}`,
        externalMessage:
          'O código municipal do serviço deve estar no formato NN.NN (LC 116).',
        context: 'FiscalGroup',
      });
    }
    if (!issqnNationalCode || !ISSQN_NATIONAL_CODE_RE.test(issqnNationalCode)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid cTribNac: ${issqnNationalCode}`,
        externalMessage:
          'O código de tributação nacional (cTribNac) deve ter 6 dígitos.',
        context: 'FiscalGroup',
      });
    }
    if (
      issqnTribType === null ||
      !(ISSQN_TRIB_TYPE_SUPPORTED as readonly string[]).includes(issqnTribType)
    ) {
      throw new ValidatorDomainError({
        internalMessage: `Unsupported ISSQN tribISSQN: ${issqnTribType}`,
        externalMessage:
          'A exigibilidade do ISS selecionada não é suportada nesta versão.',
        context: 'FiscalGroup',
      });
    }
    // A alíquota é opcional (só é transmitida com retenção); quando informada,
    // precisa estar na faixa.
    if (
      issqnRate !== null &&
      (!Number.isFinite(issqnRate) || issqnRate < 0 || issqnRate > MAX_ALIQUOTA)
    ) {
      throw new ValidatorDomainError({
        internalMessage: `ISSQN aliquota out of range: ${issqnRate}`,
        externalMessage: `A alíquota do ISS deve estar entre 0 e ${MAX_ALIQUOTA}.`,
        context: 'FiscalGroup',
      });
    }
  }

  private validateIcms(): void {
    const { icmsCst, icmsCsosn } = this.props;
    // Exatamente uma situação: CST (Regime Normal) OU CSOSN (Simples).
    if ((icmsCst === null) === (icmsCsosn === null)) {
      throw new ValidatorDomainError({
        internalMessage: `ICMS group needs exactly one of CST/CSOSN (cst=${icmsCst}, csosn=${icmsCsosn})`,
        externalMessage: 'Informe a situação do ICMS (CST ou CSOSN).',
        context: 'FiscalGroup',
      });
    }
    if (
      icmsCst !== null &&
      !(ICMS_CST_SUPPORTED as readonly string[]).includes(icmsCst)
    ) {
      throw new ValidatorDomainError({
        internalMessage: `Unsupported ICMS CST: ${icmsCst}`,
        externalMessage: `A situação de ICMS "${icmsCst}" não é suportada nesta versão.`,
        context: 'FiscalGroup',
      });
    }
    if (
      icmsCsosn !== null &&
      !(ICMS_CSOSN_SUPPORTED as readonly string[]).includes(icmsCsosn)
    ) {
      throw new ValidatorDomainError({
        internalMessage: `Unsupported ICMS CSOSN: ${icmsCsosn}`,
        externalMessage: `A situação de ICMS (CSOSN) "${icmsCsosn}" não é suportada nesta versão.`,
        context: 'FiscalGroup',
      });
    }
    for (const rate of this.props.ufRates) {
      if (!(UF_RATE_TYPES as readonly string[]).includes(rate.rateType)) {
        throw new ValidatorDomainError({
          internalMessage: `Invalid UF rate type: ${rate.rateType}`,
          externalMessage: 'Tipo de alíquota por UF inválido.',
          context: 'FiscalGroup',
        });
      }
      if (
        !Number.isFinite(rate.aliquota) ||
        rate.aliquota < 0 ||
        rate.aliquota > MAX_ALIQUOTA
      ) {
        throw new ValidatorDomainError({
          internalMessage: `UF ${rate.uf} aliquota out of range: ${rate.aliquota}`,
          externalMessage: `A alíquota de ${rate.uf} deve estar entre 0 e ${MAX_ALIQUOTA}.`,
          context: 'FiscalGroup',
        });
      }
    }
  }

  private validatePisCofins(): void {
    this.validateContribution('PIS', this.props.pisCst, this.props.pisAliquota);
    this.validateContribution(
      'COFINS',
      this.props.cofinsCst,
      this.props.cofinsAliquota,
    );
  }

  private validateContribution(
    label: 'PIS' | 'COFINS',
    cst: string | null,
    aliquota: number | null,
  ): void {
    if (cst === null) {
      throw new ValidatorDomainError({
        internalMessage: `${label} CST is required for PIS_COFINS group`,
        externalMessage: `A situação do ${label} é obrigatória.`,
        context: 'FiscalGroup',
      });
    }
    if (!(PIS_COFINS_CST_SUPPORTED as readonly string[]).includes(cst)) {
      throw new ValidatorDomainError({
        internalMessage: `Unsupported ${label} CST: ${cst}`,
        externalMessage: `A situação de ${label} "${cst}" não é suportada nesta versão.`,
        context: 'FiscalGroup',
      });
    }
    if (isPisCofinsCstTributado(cst)) {
      if (aliquota === null) {
        throw new ValidatorDomainError({
          internalMessage: `${label} aliquota required for tributado CST ${cst}`,
          externalMessage: `A alíquota de ${label} é obrigatória para a situação selecionada.`,
          context: 'FiscalGroup',
        });
      }
      if (
        !Number.isFinite(aliquota) ||
        aliquota < 0 ||
        aliquota > MAX_ALIQUOTA
      ) {
        throw new ValidatorDomainError({
          internalMessage: `${label} aliquota out of range: ${aliquota}`,
          externalMessage: `A alíquota de ${label} deve estar entre 0 e ${MAX_ALIQUOTA}.`,
          context: 'FiscalGroup',
        });
      }
    }
  }

  public static create(
    props: CreateFiscalGroupProps,
    id?: string,
  ): FiscalGroup {
    const now = new Date();
    const tributadoPis =
      props.pisCst != null && isPisCofinsCstTributado(props.pisCst);
    const tributadoCofins =
      props.cofinsCst != null && isPisCofinsCstTributado(props.cofinsCst);
    return new FiscalGroup(
      {
        organizationId: props.organizationId,
        taxType: props.taxType,
        name: props.name.trim(),
        pisCst: props.pisCst ?? null,
        // NT não guarda alíquota — normaliza para null e evita "06 com 1.65".
        pisAliquota: tributadoPis ? (props.pisAliquota ?? null) : null,
        cofinsCst: props.cofinsCst ?? null,
        cofinsAliquota: tributadoCofins ? (props.cofinsAliquota ?? null) : null,
        icmsCst: props.icmsCst ?? null,
        icmsCsosn: props.icmsCsosn ?? null,
        ufRates: props.ufRates ?? [],
        issqnServiceCode: props.issqnServiceCode ?? null,
        issqnNationalCode: props.issqnNationalCode ?? null,
        issqnRate: props.issqnRate ?? null,
        issqnTribType: props.issqnTribType ?? null,
        ipiCst: props.ipiCst ?? null,
        ipiEnquadramento: props.ipiEnquadramento ?? null,
        ipiRate: props.ipiRate ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  /** Cria um grupo de IPI (spec erp/019). */
  public static createIpi(
    organizationId: string,
    input: IpiGroupInput,
    id?: string,
  ): FiscalGroup {
    const now = new Date();
    const tributado = isIpiCstTributado(input.ipiCst);
    return new FiscalGroup(
      {
        organizationId,
        taxType: 'IPI',
        name: input.name.trim(),
        pisCst: null,
        pisAliquota: null,
        cofinsCst: null,
        cofinsAliquota: null,
        icmsCst: null,
        icmsCsosn: null,
        ufRates: [],
        issqnServiceCode: null,
        issqnNationalCode: null,
        issqnRate: null,
        issqnTribType: null,
        ipiCst: input.ipiCst,
        ipiEnquadramento: input.ipiEnquadramento.trim(),
        // CST não tributado (51–55) não guarda percentual — normaliza para null.
        ipiRate: tributado ? input.ipiRate : null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  /** Cria um grupo de ISSQN (spec erp/018). */
  public static createIssqn(
    organizationId: string,
    input: IssqnGroupInput,
    id?: string,
  ): FiscalGroup {
    const now = new Date();
    return new FiscalGroup(
      {
        organizationId,
        taxType: 'ISSQN',
        name: input.name.trim(),
        pisCst: null,
        pisAliquota: null,
        cofinsCst: null,
        cofinsAliquota: null,
        icmsCst: null,
        icmsCsosn: null,
        ufRates: [],
        issqnServiceCode: input.issqnServiceCode.trim(),
        issqnNationalCode: input.issqnNationalCode.trim(),
        issqnRate: input.issqnRate,
        issqnTribType: input.issqnTribType,
        ipiCst: null,
        ipiEnquadramento: null,
        ipiRate: null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  /** Cria um grupo de ICMS (spec erp/016). */
  public static createIcms(
    organizationId: string,
    input: IcmsGroupInput,
    id?: string,
  ): FiscalGroup {
    const now = new Date();
    return new FiscalGroup(
      {
        organizationId,
        taxType: 'ICMS',
        name: input.name.trim(),
        pisCst: null,
        pisAliquota: null,
        cofinsCst: null,
        cofinsAliquota: null,
        icmsCst: input.icmsCst,
        icmsCsosn: input.icmsCsosn,
        ufRates: normalizeUfRates(input.ufRates),
        issqnServiceCode: null,
        issqnNationalCode: null,
        issqnRate: null,
        issqnTribType: null,
        ipiCst: null,
        ipiEnquadramento: null,
        ipiRate: null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static with(props: FiscalGroupProps, id: string): FiscalGroup {
    return new FiscalGroup(props, id);
  }

  /** Edita um grupo de ICMS existente (spec erp/016). */
  updateIcms(input: IcmsGroupInput): FiscalGroup {
    return FiscalGroup.with(
      {
        ...this.props,
        name: input.name.trim(),
        icmsCst: input.icmsCst,
        icmsCsosn: input.icmsCsosn,
        ufRates: normalizeUfRates(input.ufRates),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /** Edita um grupo de IPI existente (spec erp/019). */
  updateIpi(input: IpiGroupInput): FiscalGroup {
    const tributado = isIpiCstTributado(input.ipiCst);
    return FiscalGroup.with(
      {
        ...this.props,
        name: input.name.trim(),
        ipiCst: input.ipiCst,
        ipiEnquadramento: input.ipiEnquadramento.trim(),
        ipiRate: tributado ? input.ipiRate : null,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /** Edita um grupo de ISSQN existente (spec erp/018). */
  updateIssqn(input: IssqnGroupInput): FiscalGroup {
    return FiscalGroup.with(
      {
        ...this.props,
        name: input.name.trim(),
        issqnServiceCode: input.issqnServiceCode.trim(),
        issqnNationalCode: input.issqnNationalCode.trim(),
        issqnRate: input.issqnRate,
        issqnTribType: input.issqnTribType,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  update(input: UpdateFiscalGroupInput): FiscalGroup {
    const tributadoPis =
      input.pisCst != null && isPisCofinsCstTributado(input.pisCst);
    const tributadoCofins =
      input.cofinsCst != null && isPisCofinsCstTributado(input.cofinsCst);
    return FiscalGroup.with(
      {
        ...this.props,
        name: input.name.trim(),
        pisCst: input.pisCst,
        pisAliquota: tributadoPis ? input.pisAliquota : null,
        cofinsCst: input.cofinsCst,
        cofinsAliquota: tributadoCofins ? input.cofinsAliquota : null,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get taxType() {
    return this.props.taxType;
  }
  get name() {
    return this.props.name;
  }
  get pisCst() {
    return this.props.pisCst;
  }
  get pisAliquota() {
    return this.props.pisAliquota;
  }
  get cofinsCst() {
    return this.props.cofinsCst;
  }
  get cofinsAliquota() {
    return this.props.cofinsAliquota;
  }
  get icmsCst() {
    return this.props.icmsCst;
  }
  get icmsCsosn() {
    return this.props.icmsCsosn;
  }
  get issqnServiceCode() {
    return this.props.issqnServiceCode;
  }
  get issqnNationalCode() {
    return this.props.issqnNationalCode;
  }
  get issqnRate() {
    return this.props.issqnRate;
  }
  get issqnTribType() {
    return this.props.issqnTribType;
  }
  get ipiCst() {
    return this.props.ipiCst;
  }
  get ipiEnquadramento() {
    return this.props.ipiEnquadramento;
  }
  get ipiRate() {
    return this.props.ipiRate;
  }
  get ufRates(): FiscalGroupUfRate[] {
    return this.props.ufRates;
  }
  /** Alíquota da UF para o tipo (INTERNA/INTERESTADUAL); `null` se não cadastrada. */
  ufRate(uf: string, rateType: UfRateType): number | null {
    const target = uf.trim().toUpperCase();
    const found = this.props.ufRates.find(
      (rate) => rate.uf === target && rate.rateType === rateType,
    );
    return found ? found.aliquota : null;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
