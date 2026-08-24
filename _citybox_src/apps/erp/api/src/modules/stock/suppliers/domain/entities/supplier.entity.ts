import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import {
  normalizeDocument,
  type PersonTypeValue,
} from '../../../../../shared/core/utils/document';
import { SupplierValidatorFactory } from '../factories/supplier-validator.factory';

export type SupplierAddress = {
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
};

export type SupplierContact = {
  email: string | null;
  commercialPhone: string | null;
  mobilePhone: string | null;
};

export type SupplierProps = SupplierAddress &
  SupplierContact & {
    organizationId: string;
    personType: PersonTypeValue;
    /** Nome usado no dia a dia (fantasia, para PJ). */
    name: string;
    legalName: string | null;
    /** Só dígitos — forma canônica de persistência. */
    document: string;
    stateRegistration: string | null;
    stateExempt: boolean;
    municipalRegistration: string | null;
    sufamaRegistration: string | null;
    foundationDate: Date | null;
    note: string;
    /** Unidades da organização em que o fornecedor atende. */
    branchIds: string[];
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

/**
 * Campos que o cadastro edita. Create e update compartilham a mesma
 * normalização — nome aparado, documento só com dígitos, e-mail em minúsculas
 * — para não haver duas verdades sobre a forma canônica de um fornecedor.
 */
type WritableSupplierInput = {
  personType: PersonTypeValue;
  name: string;
  legalName?: string | null;
  document: string;
  stateRegistration?: string | null;
  stateExempt?: boolean;
  municipalRegistration?: string | null;
  sufamaRegistration?: string | null;
  foundationDate?: Date | null;
  note?: string | null;
  email?: string | null;
  commercialPhone?: string | null;
  mobilePhone?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
};

type WritableSupplierProps = Omit<
  SupplierProps,
  'organizationId' | 'branchIds' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;

/** `note` sai do `Optional` porque, sozinha entre os textos, não é anulável. */
type CreateSupplierProps = Optional<
  Omit<SupplierProps, 'note'>,
  | keyof SupplierAddress
  | keyof SupplierContact
  | 'legalName'
  | 'stateRegistration'
  | 'stateExempt'
  | 'municipalRegistration'
  | 'sufamaRegistration'
  | 'foundationDate'
  | 'branchIds'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
> & { note?: string | null };

/**
 * Substituição completa (semântica de PUT): campo omitido pelo cliente vira
 * `null`, não "mantém o que estava" — mesma regra da unidade (`Branch`).
 *
 * Ao contrário da unidade, documento e tipo de pessoa **são** editáveis: o
 * fornecedor é cadastro de terceiro, e corrigir um CNPJ digitado errado é
 * rotina, não exceção.
 */
export type UpdateSupplierInput = WritableSupplierInput & {
  branchIds: string[];
};

function normalizeWritable(
  input: WritableSupplierInput,
): WritableSupplierProps {
  const stateExempt = input.stateExempt ?? false;

  return {
    personType: input.personType,
    name: input.name.trim(),
    legalName: input.legalName?.trim() || null,
    document: normalizeDocument(input.document),
    // Isento não guarda inscrição estadual: manter o número gravado deixaria o
    // cadastro afirmando duas coisas contrárias ao mesmo tempo.
    stateExempt,
    stateRegistration: stateExempt
      ? null
      : input.stateRegistration?.trim() || null,
    municipalRegistration: input.municipalRegistration?.trim() || null,
    sufamaRegistration: input.sufamaRegistration?.trim() || null,
    foundationDate: input.foundationDate ?? null,
    note: input.note?.trim() ?? '',
    email: input.email?.trim().toLowerCase() || null,
    commercialPhone: input.commercialPhone?.trim() || null,
    mobilePhone: input.mobilePhone?.trim() || null,
    zipCode: input.zipCode ? normalizeDocument(input.zipCode) : null,
    street: input.street?.trim() || null,
    number: input.number?.trim() || null,
    complement: input.complement?.trim() || null,
    district: input.district?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim().toUpperCase() || null,
  };
}

/** Ids repetidos viriam do formulário e explodiriam no unique do vínculo. */
function normalizeBranchIds(branchIds: readonly string[] = []): string[] {
  return [...new Set(branchIds.filter(Boolean))];
}

/**
 * Fornecedor: de quem a organização compra.
 *
 * O documento é único **por organização** — duas empresas podem comprar do
 * mesmo distribuidor sem saber uma da outra.
 */
export class Supplier extends Entity<SupplierProps> {
  constructor(props: SupplierProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    SupplierValidatorFactory.create().validate(this);
  }

  public static create(props: CreateSupplierProps, id?: string): Supplier {
    const now = new Date();
    return new Supplier(
      {
        ...normalizeWritable(props),
        organizationId: props.organizationId,
        branchIds: normalizeBranchIds(props.branchIds),
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: SupplierProps, id: string): Supplier {
    return new Supplier(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get personType() {
    return this.props.personType;
  }
  get name() {
    return this.props.name;
  }
  get legalName() {
    return this.props.legalName;
  }
  get document() {
    return this.props.document;
  }
  get stateRegistration() {
    return this.props.stateRegistration;
  }
  get stateExempt() {
    return this.props.stateExempt;
  }
  get municipalRegistration() {
    return this.props.municipalRegistration;
  }
  get sufamaRegistration() {
    return this.props.sufamaRegistration;
  }
  get foundationDate() {
    return this.props.foundationDate;
  }
  get note() {
    return this.props.note;
  }
  get branchIds() {
    return this.props.branchIds;
  }
  get contact(): SupplierContact {
    const { email, commercialPhone, mobilePhone } = this.props;
    return { email, commercialPhone, mobilePhone };
  }
  get address(): SupplierAddress {
    const { zipCode, street, number, complement, district, city, state } =
      this.props;
    return { zipCode, street, number, complement, district, city, state };
  }
  get deletedAt() {
    return this.props.deletedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  get displayName(): string {
    return this.props.name;
  }

  update(input: UpdateSupplierInput): Supplier {
    return Supplier.with(
      {
        ...this.props,
        ...normalizeWritable(input),
        branchIds: normalizeBranchIds(input.branchIds),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Desativa o fornecedor sem apagá-lo: compras e pedidos já emitidos apontam
   * para ele, e o histórico precisa continuar resolvendo.
   */
  softDelete(): Supplier {
    const now = new Date();
    return Supplier.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): Supplier {
    return Supplier.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }
}
