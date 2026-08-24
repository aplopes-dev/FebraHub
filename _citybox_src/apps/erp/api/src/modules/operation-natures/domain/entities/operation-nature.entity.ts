import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { isEntradaCfop, isSaidaCfop } from '../cfop.table';

const DESCRIPTION_MAX = 300;

/** Condição de aplicação da linha de CFOP (spec erp/020, FR-005): não é um valor
 * aplicado, é PARA QUEM a linha vale — itens ICMS-livre (SIM), não ICMS-livre (NAO),
 * ou os dois (AMBOS). */
export const ICMS_LIVRE_CONDITIONS = ['AMBOS', 'SIM', 'NAO'] as const;
export type IcmsLivreCondition = (typeof ICMS_LIVRE_CONDITIONS)[number];

/** Tributos que têm lista de-para de grupo (ICMS e PIS/COFINS). */
export const OPERATION_NATURE_GROUP_TAX_TYPES = ['ICMS', 'PIS_COFINS'] as const;
export type OperationNatureGroupTaxType =
  (typeof OPERATION_NATURE_GROUP_TAX_TYPES)[number];

/** Linha de-para de CFOP: entrada → saída, condicionada por ICMS livre. */
export type OperationNatureCfopRule = {
  fromCfop: string;
  toCfop: string;
  icmsLivre: IcmsLivreCondition;
};

/** Linha de-para de grupo fiscal (ICMS ou PIS/COFINS): grupo de entrada → saída. */
export type OperationNatureGroupRule = {
  taxType: OperationNatureGroupTaxType;
  fromGroupId: string;
  toGroupId: string;
};

export type OperationNatureProps = {
  organizationId: string;
  name: string;
  description: string | null;
  /** Manter Código de Benefício Fiscal na UF — sempre `false` nesta fatia (FR-009,
   * depende de `cBenef` por UF, fora de escopo). */
  keepBenefitInUf: boolean;
  cfopRules: OperationNatureCfopRule[];
  groupRules: OperationNatureGroupRule[];
  createdAt: Date;
  updatedAt: Date;
};

export type OperationNatureInput = {
  name: string;
  description: string | null;
  cfopRules: OperationNatureCfopRule[];
  groupRules: OperationNatureGroupRule[];
};

type CreateOperationNatureProps = Optional<
  OperationNatureProps,
  | 'description'
  | 'keepBenefitInUf'
  | 'cfopRules'
  | 'groupRules'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Natureza de Operação (spec erp/020): regra de-para que, dada uma operação de
 * entrada, determina CFOP e grupos fiscais da saída correspondente (caso canônico:
 * devolução para fornecedor). Entidade agregada — as três listas do prompt viram
 * duas coleções: `cfopRules` (CFOP + condição ICMS livre) e `groupRules` (ICMS e
 * PIS/COFINS, discriminadas por `taxType`).
 */
export class OperationNature extends Entity<OperationNatureProps> {
  constructor(props: OperationNatureProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (this.props.name.trim().length === 0) {
      throw new ValidatorDomainError({
        internalMessage: 'OperationNature name is empty',
        externalMessage: 'A natureza de operação precisa de um nome.',
        context: 'OperationNature',
      });
    }
    if (
      this.props.description &&
      this.props.description.length > DESCRIPTION_MAX
    ) {
      throw new ValidatorDomainError({
        internalMessage: `OperationNature description exceeds ${DESCRIPTION_MAX}`,
        externalMessage: `A descrição deve ter no máximo ${DESCRIPTION_MAX} caracteres.`,
        context: 'OperationNature',
      });
    }
    this.validateCfopRules();
    this.validateGroupRules();
  }

  private validateCfopRules(): void {
    const seen = new Set<string>();
    for (const rule of this.props.cfopRules) {
      if (!isEntradaCfop(rule.fromCfop)) {
        throw new ValidatorDomainError({
          internalMessage: `CFOP "De" não é de entrada: ${rule.fromCfop}`,
          externalMessage: `O CFOP de origem "${rule.fromCfop}" não é um CFOP de entrada.`,
          context: 'OperationNature',
        });
      }
      if (!isSaidaCfop(rule.toCfop)) {
        throw new ValidatorDomainError({
          internalMessage: `CFOP "Para" não é de saída: ${rule.toCfop}`,
          externalMessage: `O CFOP de destino "${rule.toCfop}" não é um CFOP de saída.`,
          context: 'OperationNature',
        });
      }
      if (
        !(ICMS_LIVRE_CONDITIONS as readonly string[]).includes(rule.icmsLivre)
      ) {
        throw new ValidatorDomainError({
          internalMessage: `Invalid icmsLivre condition: ${rule.icmsLivre}`,
          externalMessage: 'Condição de ICMS Livre inválida.',
          context: 'OperationNature',
        });
      }
      // Duplicata EXATA (mesmo fromCfop + mesma condição) é ambígua (D6). Mesmo
      // fromCfop com condições diferentes é válido (geral + exceção).
      const key = `${rule.fromCfop}:${rule.icmsLivre}`;
      if (seen.has(key)) {
        throw new ValidatorDomainError({
          internalMessage: `Duplicate CFOP rule: ${key}`,
          externalMessage: `Há duas linhas de CFOP iguais (${rule.fromCfop}, ICMS Livre "${rule.icmsLivre}"). Remova a duplicata.`,
          context: 'OperationNature',
        });
      }
      seen.add(key);
    }
  }

  private validateGroupRules(): void {
    for (const rule of this.props.groupRules) {
      if (
        !(OPERATION_NATURE_GROUP_TAX_TYPES as readonly string[]).includes(
          rule.taxType,
        )
      ) {
        throw new ValidatorDomainError({
          internalMessage: `Invalid group rule taxType: ${rule.taxType}`,
          externalMessage: 'Tributo da regra de grupo inválido.',
          context: 'OperationNature',
        });
      }
      if (
        rule.fromGroupId.trim().length === 0 ||
        rule.toGroupId.trim().length === 0
      ) {
        throw new ValidatorDomainError({
          internalMessage: 'Group rule missing from/to group id',
          externalMessage: 'Informe os grupos de origem e destino da regra.',
          context: 'OperationNature',
        });
      }
    }
  }

  public static create(
    props: CreateOperationNatureProps,
    id?: string,
  ): OperationNature {
    const now = new Date();
    return new OperationNature(
      {
        organizationId: props.organizationId,
        name: props.name.trim(),
        description: props.description?.trim()
          ? props.description.trim()
          : null,
        // Sempre false nesta fatia (FR-009).
        keepBenefitInUf: false,
        cfopRules: props.cfopRules ?? [],
        groupRules: props.groupRules ?? [],
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: OperationNatureProps, id: string): OperationNature {
    return new OperationNature(props, id);
  }

  update(input: OperationNatureInput): OperationNature {
    return OperationNature.with(
      {
        ...this.props,
        name: input.name.trim(),
        description: input.description?.trim()
          ? input.description.trim()
          : null,
        cfopRules: input.cfopRules,
        groupRules: input.groupRules,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get description() {
    return this.props.description;
  }
  get keepBenefitInUf() {
    return this.props.keepBenefitInUf;
  }
  get cfopRules(): OperationNatureCfopRule[] {
    return this.props.cfopRules;
  }
  get groupRules(): OperationNatureGroupRule[] {
    return this.props.groupRules;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
