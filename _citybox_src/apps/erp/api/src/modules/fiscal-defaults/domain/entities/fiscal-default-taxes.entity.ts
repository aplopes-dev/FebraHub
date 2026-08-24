import { Entity } from '../../../../shared/core/entity';

export type FiscalDefaultTaxesProps = {
  organizationId: string;
  /** Grupo padrão de ICMS (`null` = não definido). */
  icmsGroupId: string | null;
  ipiGroupId: string | null;
  pisCofinsGroupId: string | null;
  issqnGroupId: string | null;
  /** CFOP padrão = código (4 dígitos) do catálogo estático (plan D1), não um grupo. */
  cfop: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateFiscalDefaultTaxesInput = {
  icmsGroupId: string | null;
  ipiGroupId: string | null;
  pisCofinsGroupId: string | null;
  issqnGroupId: string | null;
  cfop: string;
};

/**
 * Padrão fiscal da organização — **um por org** (spec erp/014).
 *
 * Guarda o grupo padrão por tributo (referência) + o CFOP padrão. A herança é
 * exibida no frontend (`fiscal-parameters`); a emissão ainda não consome estes
 * valores (limitação declarada na spec).
 */
export class FiscalDefaultTaxes extends Entity<FiscalDefaultTaxesProps> {
  constructor(props: FiscalDefaultTaxesProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Referências de grupo (org + tributo) e CFOP são validados no use case;
    // aqui não há invariante local além da existência da organização.
  }

  /** Padrão novo: nada definido ainda (a org sempre "tem" um padrão vazio). */
  public static createDefault(
    organizationId: string,
    id?: string,
  ): FiscalDefaultTaxes {
    const now = new Date();
    return new FiscalDefaultTaxes(
      {
        organizationId,
        icmsGroupId: null,
        ipiGroupId: null,
        pisCofinsGroupId: null,
        issqnGroupId: null,
        cfop: '',
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static with(
    props: FiscalDefaultTaxesProps,
    id: string,
  ): FiscalDefaultTaxes {
    return new FiscalDefaultTaxes(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get icmsGroupId() {
    return this.props.icmsGroupId;
  }
  get ipiGroupId() {
    return this.props.ipiGroupId;
  }
  get pisCofinsGroupId() {
    return this.props.pisCofinsGroupId;
  }
  get issqnGroupId() {
    return this.props.issqnGroupId;
  }
  get cfop() {
    return this.props.cfop;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: UpdateFiscalDefaultTaxesInput): FiscalDefaultTaxes {
    return FiscalDefaultTaxes.with(
      {
        ...this.props,
        icmsGroupId: input.icmsGroupId,
        ipiGroupId: input.ipiGroupId,
        pisCofinsGroupId: input.pisCofinsGroupId,
        issqnGroupId: input.issqnGroupId,
        cfop: input.cfop,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
