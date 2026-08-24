import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import {
  normalizeDocument,
  type PersonTypeValue,
} from '../../../../shared/core/utils/document';
import { BranchValidatorFactory } from '../factories/branch-validator.factory';

export const TAX_REGIMES = [
  'MEI',
  'SIMPLES_NACIONAL',
  'LUCRO_PRESUMIDO',
  'LUCRO_REAL',
  'ISENTO',
] as const;
export type TaxRegimeValue = (typeof TAX_REGIMES)[number];

export const DEFAULT_TIMEZONE = 'America/Bahia';

export type BranchAddress = {
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
};

export type BranchProps = BranchAddress & {
  organizationId: string;
  /** Código da unidade dentro da organização (ex.: "001"). */
  code: string;
  personType: PersonTypeValue;
  document: string;
  legalName: string;
  tradeName: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  taxRegime: TaxRegimeValue;
  isHeadquarters: boolean;
  phone: string | null;
  email: string | null;
  timezone: string;
  active: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateBranchProps = Optional<
  BranchProps,
  | keyof BranchAddress
  | 'tradeName'
  | 'stateRegistration'
  | 'municipalRegistration'
  | 'taxRegime'
  | 'isHeadquarters'
  | 'phone'
  | 'email'
  | 'timezone'
  | 'active'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Substituição completa (semântica de PUT): campo omitido pelo cliente vira
 * `null`, não "mantém o que estava". Endereço incluído — misturar as duas
 * semânticas no mesmo payload é o tipo de detalhe que só aparece quando um
 * formulário apaga silenciosamente o nome fantasia de alguém.
 */
export type UpdateBranchInput = BranchAddress & {
  legalName: string;
  tradeName: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  taxRegime: TaxRegimeValue;
  isHeadquarters: boolean;
  phone: string | null;
  email: string | null;
  timezone: string;
  active: boolean;
};

/**
 * Unidade/filial: o estabelecimento com CNPJ (ou CPF) próprio, que é a unidade
 * de apuração e de nota fiscal.
 *
 * `code`, `document` e `personType` não mudam depois de criados — são a
 * identidade fiscal da unidade e aparecem em documentos já emitidos.
 */
export class Branch extends Entity<BranchProps> {
  constructor(props: BranchProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    BranchValidatorFactory.create().validate(this);
  }

  public static create(props: CreateBranchProps, id?: string): Branch {
    const now = new Date();
    return new Branch(
      {
        ...props,
        code: props.code.trim(),
        document: normalizeDocument(props.document),
        legalName: props.legalName.trim(),
        tradeName: props.tradeName?.trim() || null,
        stateRegistration: props.stateRegistration?.trim() || null,
        municipalRegistration: props.municipalRegistration?.trim() || null,
        taxRegime: props.taxRegime ?? 'SIMPLES_NACIONAL',
        isHeadquarters: props.isHeadquarters ?? false,
        zipCode: props.zipCode ? normalizeDocument(props.zipCode) : null,
        street: props.street?.trim() || null,
        number: props.number?.trim() || null,
        complement: props.complement?.trim() || null,
        neighborhood: props.neighborhood?.trim() || null,
        city: props.city?.trim() || null,
        state: props.state?.trim().toUpperCase() || null,
        phone: props.phone?.trim() || null,
        email: props.email?.trim().toLowerCase() || null,
        timezone: props.timezone?.trim() || DEFAULT_TIMEZONE,
        active: props.active ?? true,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: BranchProps, id: string): Branch {
    return new Branch(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get code() {
    return this.props.code;
  }
  get personType() {
    return this.props.personType;
  }
  get document() {
    return this.props.document;
  }
  get legalName() {
    return this.props.legalName;
  }
  get tradeName() {
    return this.props.tradeName;
  }
  get stateRegistration() {
    return this.props.stateRegistration;
  }
  get municipalRegistration() {
    return this.props.municipalRegistration;
  }
  get taxRegime() {
    return this.props.taxRegime;
  }
  get isHeadquarters() {
    return this.props.isHeadquarters;
  }
  get address(): BranchAddress {
    const { zipCode, street, number, complement, neighborhood, city, state } =
      this.props;
    return { zipCode, street, number, complement, neighborhood, city, state };
  }
  get phone() {
    return this.props.phone;
  }
  get email() {
    return this.props.email;
  }
  get timezone() {
    return this.props.timezone;
  }
  get active() {
    return this.props.active;
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
    return this.props.tradeName ?? this.props.legalName;
  }

  update(input: UpdateBranchInput): Branch {
    return Branch.with(
      {
        ...this.props,
        legalName: input.legalName.trim(),
        tradeName: input.tradeName?.trim() || null,
        stateRegistration: input.stateRegistration?.trim() || null,
        municipalRegistration: input.municipalRegistration?.trim() || null,
        taxRegime: input.taxRegime,
        isHeadquarters: input.isHeadquarters,
        zipCode: input.zipCode ? normalizeDocument(input.zipCode) : null,
        street: input.street?.trim() || null,
        number: input.number?.trim() || null,
        complement: input.complement?.trim() || null,
        neighborhood: input.neighborhood?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim().toUpperCase() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim().toLowerCase() || null,
        timezone: input.timezone.trim() || DEFAULT_TIMEZONE,
        active: input.active,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  softDelete(): Branch {
    const now = new Date();
    return Branch.with(
      { ...this.props, active: false, deletedAt: now, updatedAt: now },
      this.id,
    );
  }
}
