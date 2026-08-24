import { Entity } from '../../../../shared/core/entity';

export type FiscalDocumentItemProps = {
  fiscalDocumentId: string;
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  itemType: 'PRODUCT' | 'SERVICE';
  ncm: string | null;
  cfop: string | null;
  cst: string | null;
  csosn: string | null;
  serviceCode: string | null;
  taxJson: Record<string, unknown> | null;
};

export class FiscalDocumentItem extends Entity<FiscalDocumentItemProps> {
  constructor(props: FiscalDocumentItemProps, id: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Completude do item é responsabilidade do validador de domínio de
    // nfe/nfse (US1/US2, FR-001/FR-002) — aqui só reconstrói dados persistidos.
  }

  public static with(
    props: FiscalDocumentItemProps,
    id: string,
  ): FiscalDocumentItem {
    return new FiscalDocumentItem(props, id);
  }

  get fiscalDocumentId() {
    return this.props.fiscalDocumentId;
  }
  get description() {
    return this.props.description;
  }
  get quantity() {
    return this.props.quantity;
  }
  get unitValue() {
    return this.props.unitValue;
  }
  get totalValue() {
    return this.props.totalValue;
  }
  get itemType() {
    return this.props.itemType;
  }
  get ncm() {
    return this.props.ncm;
  }
  get cfop() {
    return this.props.cfop;
  }
  get cst() {
    return this.props.cst;
  }
  get csosn() {
    return this.props.csosn;
  }
  get serviceCode() {
    return this.props.serviceCode;
  }
  get taxJson() {
    return this.props.taxJson;
  }
}
