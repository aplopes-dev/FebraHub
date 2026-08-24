import { Entity } from '../../../../shared/core/entity';

export type CustomerDocumentType = 'CPF' | 'CNPJ';

export type CustomerAddress = {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  /// Código IBGE do município — opcional: sem ele, o `enderDest` da NF-e é
  /// omitido (é `minOccurs="0"` no schema oficial), então a emissão segue
  /// válida mesmo sem endereço completo do destinatário.
  cityCodeIbge?: string | null;
  city: string;
  uf: string;
  zipCode?: string | null;
};

export type CustomerProps = {
  companyId: string;
  documentType: CustomerDocumentType;
  document: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  address: CustomerAddress;
  createdAt: Date;
};

/// Destinatário/tomador — relativo sempre a um Emitente (spec.md Key
/// Entities). Criado sob demanda a partir dos dados enviados inline na
/// requisição de emissão (contracts/nfe-api.md) — não há cadastro prévio
/// separado no v1.
export class Customer extends Entity<CustomerProps> {
  constructor(props: CustomerProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de forma é responsabilidade do validador de domínio de
    // nfe/nfse que constrói este objeto a partir da requisição.
  }

  public static create(props: Omit<CustomerProps, 'createdAt'>): Customer {
    return new Customer({ ...props, createdAt: new Date() });
  }

  public static with(props: CustomerProps, id: string): Customer {
    return new Customer(props, id);
  }

  get companyId() {
    return this.props.companyId;
  }
  get documentType() {
    return this.props.documentType;
  }
  get document() {
    return this.props.document;
  }
  get name() {
    return this.props.name;
  }
  get email() {
    return this.props.email;
  }
  get address() {
    return this.props.address;
  }
  get createdAt() {
    return this.props.createdAt;
  }
}
