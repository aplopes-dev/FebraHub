import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import {
  normalizeDocument,
  type PersonTypeValue,
} from '../../../../../shared/core/utils/document';
import { CarrierValidatorFactory } from '../factories/carrier-validator.factory';

export const CARRIER_DELIVERY_TYPES = ['transportadora', 'entregador'] as const;
export type CarrierDeliveryTypeValue = (typeof CARRIER_DELIVERY_TYPES)[number];

export type CarrierAddress = {
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
};

export type CarrierContact = {
  email: string | null;
  commercialPhone: string | null;
  mobilePhone: string | null;
};

export type CarrierProps = CarrierAddress &
  CarrierContact & {
    organizationId: string;
    personType: PersonTypeValue;
    /** `transportadora` (pessoa jurídica típica) ou `entregador` (autônomo). */
    deliveryType: CarrierDeliveryTypeValue;
    /** Nome usado no dia a dia (fantasia, para PJ). */
    name: string;
    legalName: string | null;
    /** Só dígitos — forma canônica de persistência. */
    document: string;
    /** Isento de ICMS no frete. */
    icmsExempt: boolean;
    /** Se a transportadora deve ser registrada como transportador na NF-e. */
    registerInNfe: boolean;
    stateRegistration: string | null;
    stateExempt: boolean;
    municipalRegistration: string | null;
    /** Unidades da organização em que a transportadora atende. */
    branchIds: string[];
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

/**
 * Campos que o cadastro edita. Create e update compartilham a mesma
 * normalização — nome aparado, documento só com dígitos, e-mail em minúsculas
 * — para não haver duas verdades sobre a forma canônica de uma transportadora.
 */
type WritableCarrierInput = {
  personType: PersonTypeValue;
  deliveryType: CarrierDeliveryTypeValue;
  name: string;
  legalName?: string | null;
  document: string;
  icmsExempt?: boolean;
  registerInNfe?: boolean;
  stateRegistration?: string | null;
  stateExempt?: boolean;
  municipalRegistration?: string | null;
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

type WritableCarrierProps = Omit<
  CarrierProps,
  'organizationId' | 'branchIds' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;

type CreateCarrierProps = Optional<
  CarrierProps,
  | keyof CarrierAddress
  | keyof CarrierContact
  | 'legalName'
  | 'icmsExempt'
  | 'registerInNfe'
  | 'stateRegistration'
  | 'stateExempt'
  | 'municipalRegistration'
  | 'branchIds'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Substituição completa (semântica de PUT): campo omitido pelo cliente vira
 * `null`, não "mantém o que estava" — mesma regra da unidade (`Branch`).
 *
 * Documento e tipo de pessoa **são** editáveis: a transportadora é cadastro de
 * terceiro, e corrigir um CNPJ digitado errado é rotina, não exceção.
 */
export type UpdateCarrierInput = WritableCarrierInput & {
  branchIds: string[];
};

function normalizeWritable(input: WritableCarrierInput): WritableCarrierProps {
  const stateExempt = input.stateExempt ?? false;

  return {
    personType: input.personType,
    deliveryType: input.deliveryType,
    name: input.name.trim(),
    legalName: input.legalName?.trim() || null,
    document: normalizeDocument(input.document),
    icmsExempt: input.icmsExempt ?? false,
    registerInNfe: input.registerInNfe ?? false,
    // Isento não guarda inscrição estadual: manter o número gravado deixaria o
    // cadastro afirmando duas coisas contrárias ao mesmo tempo.
    stateExempt,
    stateRegistration: stateExempt
      ? null
      : input.stateRegistration?.trim() || null,
    municipalRegistration: input.municipalRegistration?.trim() || null,
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
 * Transportadora: quem entrega os pedidos da organização (transportadora
 * terceirizada ou entregador autônomo).
 *
 * O documento é único **por organização** — duas empresas podem contratar a
 * mesma transportadora sem saber uma da outra.
 */
export class Carrier extends Entity<CarrierProps> {
  constructor(props: CarrierProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    CarrierValidatorFactory.create().validate(this);
  }

  public static create(props: CreateCarrierProps, id?: string): Carrier {
    const now = new Date();
    return new Carrier(
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

  public static with(props: CarrierProps, id: string): Carrier {
    return new Carrier(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get personType() {
    return this.props.personType;
  }
  get deliveryType() {
    return this.props.deliveryType;
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
  get icmsExempt() {
    return this.props.icmsExempt;
  }
  get registerInNfe() {
    return this.props.registerInNfe;
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
  get branchIds() {
    return this.props.branchIds;
  }
  get contact(): CarrierContact {
    const { email, commercialPhone, mobilePhone } = this.props;
    return { email, commercialPhone, mobilePhone };
  }
  get address(): CarrierAddress {
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

  update(input: UpdateCarrierInput): Carrier {
    return Carrier.with(
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
   * Desativa a transportadora sem apagá-la: pedidos e transferências já
   * emitidos apontam para ela, e o histórico precisa continuar resolvendo.
   */
  softDelete(): Carrier {
    const now = new Date();
    return Carrier.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): Carrier {
    return Carrier.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }
}
