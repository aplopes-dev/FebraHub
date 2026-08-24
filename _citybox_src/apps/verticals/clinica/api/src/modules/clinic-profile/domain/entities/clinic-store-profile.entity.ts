import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { ClinicStoreProfileValidatorFactory } from '../factories/clinic-store-profile-validator.factory';

export type ClinicStoreProfileProps = {
  storeId: string;
  clinicName: string;
  cnpj: string;
  communicationsName: string;
  responsible: string;
  logoObjectKey: string | null;
  logoMimeType: string | null;
  openingTime: string;
  closingTime: string;
  email: string;
  phone: string;
  mobile: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateClinicStoreProfileInput = {
  clinicName: string;
  cnpj: string;
  communicationsName: string;
  responsible: string;
  openingTime: string;
  closingTime: string;
  email: string;
  phone: string;
  mobile: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export class ClinicStoreProfile extends Entity<ClinicStoreProfileProps> {
  constructor(props: ClinicStoreProfileProps, id?: string) {
    super(props, id ?? props.storeId);
    this.validate();
  }

  protected validate(): void {
    ClinicStoreProfileValidatorFactory.create().validate(this);
  }

  static create(
    props: Optional<
      ClinicStoreProfileProps,
      | 'clinicName'
      | 'cnpj'
      | 'communicationsName'
      | 'responsible'
      | 'logoObjectKey'
      | 'logoMimeType'
      | 'openingTime'
      | 'closingTime'
      | 'email'
      | 'phone'
      | 'mobile'
      | 'cep'
      | 'street'
      | 'number'
      | 'complement'
      | 'neighborhood'
      | 'city'
      | 'state'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): ClinicStoreProfile {
    return new ClinicStoreProfile(
      {
        ...props,
        clinicName: props.clinicName ?? '',
        cnpj: props.cnpj ?? '',
        communicationsName: props.communicationsName ?? '',
        responsible: props.responsible ?? '',
        logoObjectKey: props.logoObjectKey ?? null,
        logoMimeType: props.logoMimeType ?? null,
        openingTime: props.openingTime ?? '08:00',
        closingTime: props.closingTime ?? '18:00',
        email: props.email ?? '',
        phone: props.phone ?? '',
        mobile: props.mobile ?? '',
        cep: props.cep ?? '',
        street: props.street ?? '',
        number: props.number ?? '',
        complement: props.complement ?? '',
        neighborhood: props.neighborhood ?? '',
        city: props.city ?? '',
        state: props.state ?? '',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(
    props: ClinicStoreProfileProps,
    storeId: string,
  ): ClinicStoreProfile {
    return new ClinicStoreProfile(props, storeId);
  }

  static defaults(storeId: string): ClinicStoreProfile {
    return ClinicStoreProfile.create({ storeId });
  }

  get storeId() {
    return this.props.storeId;
  }
  get clinicName() {
    return this.props.clinicName;
  }
  get cnpj() {
    return this.props.cnpj;
  }
  get communicationsName() {
    return this.props.communicationsName;
  }
  get responsible() {
    return this.props.responsible;
  }
  get logoObjectKey() {
    return this.props.logoObjectKey;
  }
  get logoMimeType() {
    return this.props.logoMimeType;
  }
  get openingTime() {
    return this.props.openingTime;
  }
  get closingTime() {
    return this.props.closingTime;
  }
  get email() {
    return this.props.email;
  }
  get phone() {
    return this.props.phone;
  }
  get mobile() {
    return this.props.mobile;
  }
  get cep() {
    return this.props.cep;
  }
  get street() {
    return this.props.street;
  }
  get number() {
    return this.props.number;
  }
  get complement() {
    return this.props.complement;
  }
  get neighborhood() {
    return this.props.neighborhood;
  }
  get city() {
    return this.props.city;
  }
  get state() {
    return this.props.state;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  hasLogo(): boolean {
    return this.props.logoObjectKey !== null;
  }

  setLogo(key: string, mimeType: string): void {
    this.props.logoObjectKey = key;
    this.props.logoMimeType = mimeType;
    this.touch();
    this.validate();
  }

  clearLogo(): void {
    this.props.logoObjectKey = null;
    this.props.logoMimeType = null;
    this.touch();
    this.validate();
  }

  touch(): void {
    this.props.updatedAt = new Date();
  }

  update(input: UpdateClinicStoreProfileInput): void {
    this.props.clinicName = input.clinicName;
    this.props.cnpj = input.cnpj;
    this.props.communicationsName = input.communicationsName;
    this.props.responsible = input.responsible;
    this.props.openingTime = input.openingTime;
    this.props.closingTime = input.closingTime;
    this.props.email = input.email;
    this.props.phone = input.phone;
    this.props.mobile = input.mobile;
    this.props.cep = input.cep;
    this.props.street = input.street;
    this.props.number = input.number;
    this.props.complement = input.complement;
    this.props.neighborhood = input.neighborhood;
    this.props.city = input.city;
    this.props.state = input.state;
    this.touch();
    this.validate();
  }
}
