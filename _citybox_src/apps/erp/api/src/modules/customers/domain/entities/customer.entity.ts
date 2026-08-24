import { randomUUID } from 'node:crypto';
import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import {
  normalizeDocument,
  type PersonTypeValue,
} from '../../../../shared/core/utils/document';
import { CustomerValidatorFactory } from '../factories/customer-validator.factory';

export const CUSTOMER_STAGES = [
  'lead',
  'opportunity',
  'active',
  'inactive',
] as const;
export type CustomerStageValue = (typeof CUSTOMER_STAGES)[number];

export const CUSTOMER_ADDRESS_TYPES = [
  'principal',
  'entrega',
  'outro',
] as const;
export type CustomerAddressTypeValue = (typeof CUSTOMER_ADDRESS_TYPES)[number];

export type CustomerAddressProps = {
  id: string;
  addressType: CustomerAddressTypeValue;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  complement: string | null;
};

export type CustomerAddressInput = {
  id?: string;
  addressType: CustomerAddressTypeValue;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  complement?: string | null;
};

export type CustomerProps = {
  organizationId: string;
  personType: PersonTypeValue;
  name: string;
  /** Só dígitos, ou null se ainda não informado. */
  document: string | null;
  rg: string | null;
  birthDate: Date | null;
  email: string | null;
  mobilePhone: string | null;
  phone: string | null;
  additionalPhones: string[];
  stage: CustomerStageValue;
  categoryId: string | null;
  notes: string;
  addresses: CustomerAddressProps[];
  branchIds: string[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type WritableCustomerInput = {
  personType: PersonTypeValue;
  name: string;
  document?: string | null;
  rg?: string | null;
  birthDate?: Date | null;
  email?: string | null;
  mobilePhone?: string | null;
  phone?: string | null;
  additionalPhones?: string[];
  stage?: CustomerStageValue;
  categoryId?: string | null;
  notes?: string | null;
  addresses?: CustomerAddressInput[];
};

type WritableCustomerProps = Omit<
  CustomerProps,
  'organizationId' | 'branchIds' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;

type CreateCustomerProps = Optional<
  Omit<CustomerProps, 'notes' | 'addresses' | 'additionalPhones' | 'stage'>,
  | 'document'
  | 'rg'
  | 'birthDate'
  | 'email'
  | 'mobilePhone'
  | 'phone'
  | 'categoryId'
  | 'branchIds'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
> & {
  notes?: string | null;
  additionalPhones?: string[];
  stage?: CustomerStageValue;
  addresses?: CustomerAddressInput[];
};

export type UpdateCustomerInput = WritableCustomerInput & {
  branchIds: string[];
};

function normalizeDocumentOrNull(
  document: string | null | undefined,
): string | null {
  if (document == null) return null;
  const digits = normalizeDocument(document);
  return digits.length > 0 ? digits : null;
}

function normalizeAddress(input: CustomerAddressInput): CustomerAddressProps {
  return {
    id: input.id?.trim() || randomUUID(),
    addressType: input.addressType,
    zipCode: input.zipCode ? normalizeDocument(input.zipCode) || null : null,
    street: input.street?.trim() || null,
    number: input.number?.trim() || null,
    district: input.district?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim().toUpperCase() || null,
    complement: input.complement?.trim() || null,
  };
}

function normalizeWritable(
  input: WritableCustomerInput,
): WritableCustomerProps {
  const personType = input.personType;
  return {
    personType,
    name: input.name.trim(),
    document: normalizeDocumentOrNull(input.document),
    rg: input.rg?.trim() || null,
    birthDate: personType === 'PF' ? (input.birthDate ?? null) : null,
    email: input.email?.trim().toLowerCase() || null,
    mobilePhone: input.mobilePhone?.trim() || null,
    phone: input.phone?.trim() || null,
    additionalPhones: (input.additionalPhones ?? [])
      .map((p) => p.trim())
      .filter(Boolean),
    stage: input.stage ?? 'lead',
    categoryId: input.categoryId?.trim() || null,
    notes: input.notes?.trim() ?? '',
    addresses: (input.addresses ?? []).map(normalizeAddress),
  };
}

function normalizeBranchIds(branchIds: readonly string[] = []): string[] {
  return [...new Set(branchIds.filter(Boolean))];
}

/**
 * Cliente comercial da organização — PF/PJ com estágio CRM, N endereços e
 * vínculo opcional por unidade.
 */
export class Customer extends Entity<CustomerProps> {
  constructor(props: CustomerProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    CustomerValidatorFactory.create().validate(this);
  }

  public static create(props: CreateCustomerProps, id?: string): Customer {
    const now = new Date();
    return new Customer(
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

  public static with(props: CustomerProps, id: string): Customer {
    return new Customer(props, id);
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
  get document() {
    return this.props.document;
  }
  get rg() {
    return this.props.rg;
  }
  get birthDate() {
    return this.props.birthDate;
  }
  get email() {
    return this.props.email;
  }
  get mobilePhone() {
    return this.props.mobilePhone;
  }
  get phone() {
    return this.props.phone;
  }
  get additionalPhones() {
    return this.props.additionalPhones;
  }
  get stage() {
    return this.props.stage;
  }
  get categoryId() {
    return this.props.categoryId;
  }
  get notes() {
    return this.props.notes;
  }
  get addresses() {
    return this.props.addresses;
  }
  get branchIds() {
    return this.props.branchIds;
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

  /** Telefone principal para listagens: celular, senão fixo. */
  get primaryPhone(): string {
    return this.props.mobilePhone ?? this.props.phone ?? '';
  }

  update(input: UpdateCustomerInput): Customer {
    return Customer.with(
      {
        ...this.props,
        ...normalizeWritable(input),
        branchIds: normalizeBranchIds(input.branchIds),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  softDelete(): Customer {
    const now = new Date();
    return Customer.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): Customer {
    return Customer.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }
}
