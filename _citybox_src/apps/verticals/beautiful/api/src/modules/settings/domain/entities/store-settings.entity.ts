import { Entity } from '../../../../shared/core/entity';
import { StoreSettingsValidatorFactory } from '../factories/store-settings-validator.factory';
import { DEFAULT_STORE_THEME_ID } from '../store-theme-ids';

export interface StoreSettingsProps {
  storeId: string;
  name: string;
  themeId?: string;
  cnpj?: string | null;
  communicationsName?: string | null;
  responsible?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  logoObjectKey?: string | null;
  logoMimeType?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StoreSettingsEntity extends Entity<StoreSettingsProps> {
  private constructor(props: StoreSettingsProps, id?: string) {
    super(
      {
        ...props,
        themeId: props.themeId ?? DEFAULT_STORE_THEME_ID,
        cnpj: props.cnpj ?? null,
        communicationsName: props.communicationsName ?? null,
        responsible: props.responsible ?? null,
        email: props.email ?? null,
        phone: props.phone ?? null,
        mobile: props.mobile ?? null,
        cep: props.cep ?? null,
        street: props.street ?? null,
        number: props.number ?? null,
        complement: props.complement ?? null,
        neighborhood: props.neighborhood ?? null,
        city: props.city ?? null,
        state: props.state ?? null,
        logoObjectKey: props.logoObjectKey ?? null,
        logoMimeType: props.logoMimeType ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    this.validate();
  }

  protected validate(): void {
    StoreSettingsValidatorFactory.create().validate(this.props);
  }

  public static create(
    props: StoreSettingsProps,
    id?: string,
  ): StoreSettingsEntity {
    return new StoreSettingsEntity(props, id);
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get name(): string {
    return this.props.name;
  }

  get themeId(): string {
    return this.props.themeId ?? DEFAULT_STORE_THEME_ID;
  }

  get cnpj(): string | null {
    return this.props.cnpj ?? null;
  }

  get communicationsName(): string | null {
    return this.props.communicationsName ?? null;
  }

  get responsible(): string | null {
    return this.props.responsible ?? null;
  }

  get email(): string | null {
    return this.props.email ?? null;
  }

  get phone(): string | null {
    return this.props.phone ?? null;
  }

  get mobile(): string | null {
    return this.props.mobile ?? null;
  }

  get cep(): string | null {
    return this.props.cep ?? null;
  }

  get street(): string | null {
    return this.props.street ?? null;
  }

  get number(): string | null {
    return this.props.number ?? null;
  }

  get complement(): string | null {
    return this.props.complement ?? null;
  }

  get neighborhood(): string | null {
    return this.props.neighborhood ?? null;
  }

  get city(): string | null {
    return this.props.city ?? null;
  }

  get state(): string | null {
    return this.props.state ?? null;
  }

  get logoObjectKey(): string | null {
    return this.props.logoObjectKey ?? null;
  }

  get logoMimeType(): string | null {
    return this.props.logoMimeType ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  public hasLogo(): boolean {
    return Boolean(this.props.logoObjectKey && this.props.logoMimeType);
  }

  public setLogo(objectKey: string, mimeType: string): void {
    this.props.logoObjectKey = objectKey;
    this.props.logoMimeType = mimeType;
    this.props.updatedAt = new Date();
    this.validate();
  }

  public clearLogo(): void {
    this.props.logoObjectKey = null;
    this.props.logoMimeType = null;
    this.props.updatedAt = new Date();
    this.validate();
  }

  public update(
    data: Partial<
      Omit<StoreSettingsProps, 'storeId' | 'createdAt' | 'updatedAt'>
    >,
  ): void {
    if (data.name !== undefined) this.props.name = data.name;
    if (data.themeId !== undefined) this.props.themeId = data.themeId;
    if (data.cnpj !== undefined) this.props.cnpj = data.cnpj;
    if (data.communicationsName !== undefined)
      this.props.communicationsName = data.communicationsName;
    if (data.responsible !== undefined)
      this.props.responsible = data.responsible;
    if (data.email !== undefined) this.props.email = data.email;
    if (data.phone !== undefined) this.props.phone = data.phone;
    if (data.mobile !== undefined) this.props.mobile = data.mobile;
    if (data.cep !== undefined) this.props.cep = data.cep;
    if (data.street !== undefined) this.props.street = data.street;
    if (data.number !== undefined) this.props.number = data.number;
    if (data.complement !== undefined) this.props.complement = data.complement;
    if (data.neighborhood !== undefined)
      this.props.neighborhood = data.neighborhood;
    if (data.city !== undefined) this.props.city = data.city;
    if (data.state !== undefined) this.props.state = data.state;
    this.props.updatedAt = new Date();
    this.validate();
  }
}
